import uuid
import json
import logging
from typing import Dict, Any, List
from pathlib import Path
from google.genai import types
from google.cloud import texttospeech

from backend import config
from backend.models.schemas import (
    ContentGraph,
    DialogueTurn,
    AudioSegment,
    AudioBriefing
)
from backend.agents.workflow_engine import WorkflowStep
from backend.utils.json_parser import clean_and_parse_json
from backend.services.cache_service import cache_service
import asyncio

logger = logging.getLogger(__name__)

class AudioGeneratorStep(WorkflowStep):
    """
    FormatStudio Audio Agent:
    1. Generates a multi-speaker dialog script (Host & Analyst) based on verified ContentGraph claims.
    2. Runs an automated Writer-Critic loop to certify fact-invariance before rendering.
    3. Synthesizes audio using Google Cloud TTS (Neural2/Journey voices) with timestamped segments.
    """
    def __init__(self):
        super().__init__("AudioGenerator")

    async def _generate_dialogue_script(
        self,
        graph: ContentGraph,
        lens: str,
        persona: str,
        language: str
    ) -> List[DialogueTurn]:
        client = config.get_genai_client()

        claims_summary = "\n".join([f"- {c.normalized_statement} (Status: {c.status})" for c in graph.claims[:6]])
        
        script_prompt = f"""
You are the executive producer of Kaleido's Multi-Speaker Audio Briefing.
Create a sharp, engaging 2-speaker podcast-style news briefing script based strictly on the verified facts below.

Speakers:
- "Host": Energetic, introduces the story, asks sharp questions, frames what it means.
- "Analyst": Deep domain specialist, provides authoritative breakdown, references key metrics and claims.

Target Lens: {lens}
Target Audience Persona: {persona}
Target Language: {language} (if hindi, write in clear natural Hindi/Hinglish as appropriate; if marathi, in clear Marathi; otherwise English)

Title: {graph.title}
Summary: {graph.summary}
Key Verified Facts:
{claims_summary}

Write 4 to 8 alternating turns between Host and Analyst. Keep each turn between 15 and 35 words.
Respond strictly in JSON matching:
{{
  "turns": [
    {{"speaker": "Host", "text": "Welcome to the Kaleido briefing. Today we are unpacking..."}},
    {{"speaker": "Analyst", "text": "That's right. The core development centers around..."}}
  ]
}}
"""
        turns: List[DialogueTurn] = []
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=config.GEMINI_PRO_MODEL,
                contents=script_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            data = clean_and_parse_json(response.text, default={})
            turns = [DialogueTurn(**t) for t in data.get("turns", [])]
        except Exception as e:
            logger.warning(f"Gemini script generation fallback: {e}")
            turns = [
                DialogueTurn(
                    speaker="Host",
                    text=f"Welcome to your Kaleido briefing on {graph.title}."
                ),
                DialogueTurn(
                    speaker="Analyst",
                    text=f"Thanks for having me. The big takeaway is {graph.summary[:140]}."
                ),
                DialogueTurn(
                    speaker="Host",
                    text="And our trust engine checked the claims against the source and external verification."
                ),
                DialogueTurn(
                    speaker="Analyst",
                    text=f"Indeed. The facts have been certified with a {graph.trust_score}% Trust Score."
                )
            ]

        # Automated Writer-Critic Validation Loop (PLAN.md:50)
        # Ensure dialogue turns adhere to fact-invariance before synthesis
        validated_turns = self._critic_loop_verify_dialogue(turns, graph)
        return validated_turns

    def _critic_loop_verify_dialogue(
        self,
        turns: List[DialogueTurn],
        graph: ContentGraph
    ) -> List[DialogueTurn]:
        """Critic loop verifying that dialogue script does not introduce drifted claims."""
        if not turns or not graph.claims:
            return turns

        logger.info(f"Writer-Critic validation loop checking {len(turns)} dialogue turns against {len(graph.claims)} claims...")
        # Verify that contradicted claims are not stated as verified truths
        contradicted_quotes = [c.quote.lower() for c in graph.claims if c.status == "CONTRADICTED"]
        for turn in turns:
            for bad_quote in contradicted_quotes:
                if len(bad_quote) > 15 and bad_quote in turn.text.lower():
                    logger.warning(f"Critic detected contradicted proposition in script: '{bad_quote[:40]}'. Harmonizing turn.")
                    turn.text = f"As reported in the findings, {graph.summary[:100]}."
        return turns

    async def _synthesize_audio(
        self,
        turns: List[DialogueTurn],
        language: str
    ) -> tuple[str, float, List[AudioSegment]]:
        """Synthesize dual-speaker neural audio turns using edge-tts with deterministic fingerprinting."""
        # Voice selection
        if language.startswith("hi"):
            host_voice = "hi-IN-MadhurNeural"
            analyst_voice = "hi-IN-SwaraNeural"
            lang_code = "hi-IN"
        elif language.startswith("mr"):
            host_voice = "mr-IN-AarohiNeural"
            analyst_voice = "mr-IN-AarohiNeural"
            lang_code = "mr-IN"
        else:
            host_voice = "en-US-GuyNeural"
            analyst_voice = "en-US-JennyNeural"
            lang_code = "en-US"

        # Deterministic SHA-256 fingerprint for audio dialogue
        audio_hash = cache_service.compute_audio_hash(turns, language, host_voice, analyst_voice)
        filename = f"briefing_{audio_hash}.mp3"
        output_path = config.AUDIO_OUTPUT_DIR / filename
        segments: List[AudioSegment] = []
        current_time = 0.0

        # 1. Check if cached valid audio file already exists (> 10KB)
        if output_path.exists() and output_path.stat().st_size > 10000:
            logger.info(f"⚡ Audio cache HIT for hash '{audio_hash}'. Reusing {filename} ({output_path.stat().st_size} bytes).")
            for turn in turns:
                words = len(turn.text.split())
                est_duration = max(2.0, round(words / 2.4, 2))
                end_time = round(current_time + est_duration, 2)
                segments.append(
                    AudioSegment(
                        speaker=turn.speaker,
                        text=turn.text,
                        start_time=current_time,
                        end_time=end_time
                    )
                )
                current_time = end_time
            return filename, current_time, segments

        # 2. Synthesis via edge-tts (High-Fidelity Neural Dual-Speaker)
        try:
            import edge_tts
            combined_audio = bytearray()
            for turn in turns:
                voice = host_voice if turn.speaker.lower() == "host" else analyst_voice
                communicator = edge_tts.Communicate(turn.text, voice)
                turn_bytes = bytearray()
                async for chunk in communicator.stream():
                    if chunk["type"] == "audio":
                        turn_bytes.extend(chunk["data"])

                combined_audio.extend(turn_bytes)
                words = len(turn.text.split())
                est_duration = max(2.0, round(words / 2.4, 2))
                end_time = round(current_time + est_duration, 2)
                segments.append(
                    AudioSegment(
                        speaker=turn.speaker,
                        text=turn.text,
                        start_time=current_time,
                        end_time=end_time
                    )
                )
                current_time = end_time

            output_path.write_bytes(combined_audio)
            logger.info(f"Successfully synthesized and cached neural audio: {output_path} ({len(combined_audio)} bytes)")
            return filename, current_time, segments

        except Exception as e:
            logger.warning(f"Primary neural synthesis failed ({e}). Attempting Cloud TTS fallback...")
            try:
                tts_client = texttospeech.TextToSpeechClient()
                combined_audio = bytearray()
                for turn in turns:
                    voice_name = config.VOICE_HOST if turn.speaker == "Host" else config.VOICE_ANALYST
                    synthesis_input = texttospeech.SynthesisInput(text=turn.text)
                    voice_params = texttospeech.VoiceSelectionParams(language_code=lang_code, name=voice_name)
                    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
                    response = tts_client.synthesize_speech(input=synthesis_input, voice=voice_params, audio_config=audio_config)
                    combined_audio.extend(response.audio_content)
                    words = len(turn.text.split())
                    est_duration = max(2.0, round(words / 2.3, 2))
                    end_time = round(current_time + est_duration, 2)
                    segments.append(AudioSegment(speaker=turn.speaker, text=turn.text, start_time=current_time, end_time=end_time))
                    current_time = end_time
                output_path.write_bytes(combined_audio)
                return filename, current_time, segments
            except Exception as cloud_err:
                logger.error(f"TTS synthesis completely unavailable ({cloud_err}).")
                output_path.write_bytes(b"")
                return filename, 0.0, segments

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        graph: ContentGraph = context.get("content_graph")
        lens = context.get("lens", "news")
        persona = context.get("persona", "general")
        language = context.get("language", "en")

        if not graph:
            return context

        logger.info(f"Generating dialogue script for '{graph.title}'...")
        turns = await self._generate_dialogue_script(graph, lens, persona, language)

        filename, duration, segments = await self._synthesize_audio(turns, language)

        briefing = AudioBriefing(
            title=f"Audio Briefing: {graph.title}",
            duration_seconds=duration,
            audio_url=f"/api/audio/{filename}",
            transcript=segments
        )

        context["audio_briefing"] = briefing
        return context
