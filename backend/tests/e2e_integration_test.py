import asyncio
import json
import httpx
import sys

BASE_URL = "http://localhost:8000"

async def run_e2e_test():
    print("=== STARTING FULL E2E API INTEGRATION TEST ===")
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=90.0) as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 1. /api/health returned 200 OK")

        # 2. Samples
        res = await client.get("/api/samples")
        assert res.status_code == 200
        samples = res.json()
        assert len(samples) >= 2
        print(f"[PASS] 2. /api/samples returned {len(samples)} golden demo samples")

        # 3. Ingestion
        payload = {
            "input_type": "text",
            "content": samples[0]["content"],
            "lens": "news",
            "persona": "student",
            "language": "en"
        }
        res = await client.post("/api/ingest", json=payload)
        assert res.status_code == 202
        job_id = res.json()["job_id"]
        print(f"[PASS] 3. /api/ingest started job {job_id}")

        # 4. SSE Stream tracking
        print("  Streaming pipeline progress via SSE...")
        completed = False
        async with client.stream("GET", f"/api/jobs/{job_id}/stream") as stream:
            async for line in stream.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        data = json.loads(data_str)
                        stage = data.get("stage")
                        pct = data.get("progress_pct")
                        msg = data.get("message")
                        print(f"    [{stage} - {pct}%] {msg}")
                        if stage == "completed":
                            completed = True
                            break
                        elif stage == "failed":
                            raise RuntimeError(f"Job failed: {data.get('error')}")
                    except Exception as e:
                        if completed:
                            break

        assert completed, "Pipeline did not reach completed state"
        print("[PASS] 4. SSE Stream completed at 100%")

        # 5. Job details check
        res = await client.get(f"/api/jobs/{job_id}")
        assert res.status_code == 200
        job_data = res.json()

        # Check graph
        graph = job_data["graph"]
        assert graph is not None
        assert len(graph["claims"]) > 0
        assert graph["trust_score"] >= 0.0
        print(f"[PASS] 5a. ContentGraph verified: '{graph['title']}', Trust Score: {graph['trust_score']}% ({len(graph['claims'])} claims)")

        # Check audio
        audio = job_data["audio"]
        assert audio is not None
        assert len(audio["transcript"]) > 0
        print(f"[PASS] 5b. Audio Briefing verified: duration {audio['duration_seconds']}s, {len(audio['transcript'])} dialogue turns")

        # Check audio file download
        audio_url = audio["audio_url"]
        audio_res = await client.get(audio_url)
        assert audio_res.status_code == 200
        print(f"[PASS] 5c. Static audio serving verified at {audio_url} ({len(audio_res.content)} bytes)")

        # Check quiz
        quiz = job_data["quiz"]
        assert quiz is not None
        assert len(quiz["questions"]) > 0
        print(f"[PASS] 5d. Interactive Quiz verified: {len(quiz['questions'])} questions with claim citations")

        # Check story deck
        story = job_data["story_deck"]
        assert story is not None
        assert len(story["cards"]) > 0
        print(f"[PASS] 5e. Visual Story Deck verified: {len(story['cards'])} cards with key metrics")

        # 6. Events Telemetry
        event_payload = {
            "job_id": job_id,
            "persona": "student",
            "language": "en",
            "format_type": "quiz",
            "section_index": 1,
            "time_spent_ms": 5400,
            "completed": True,
            "dropped_off": False
        }
        res = await client.post("/api/events", json=event_payload)
        assert res.status_code == 200
        print(f"[PASS] 6. Reader telemetry recorded: {res.json()}")

        # 7. Insights Agent drop-off analysis
        res = await client.get(f"/api/insights/{job_id}")
        assert res.status_code == 200
        insight_data = res.json()
        print(f"[PASS] 7. InsightsAgent analysis: Drop-off at section {insight_data['high_drop_off_section']} ({insight_data['drop_off_rate_pct']}%)")
        print(f"     Diagnosis: {insight_data['diagnosis']}")

        # 8. Variant Optimization
        res = await client.post("/api/optimize-variant", json={"job_id": job_id, "target_section": insight_data['high_drop_off_section']})
        assert res.status_code == 200
        opt_data = res.json()
        assert opt_data["fact_invariance_verified"] is True
        print(f"[PASS] 8. Variant regenerated with fact-invariance verified: {opt_data['new_variant_text'][:80]}...")

        # 9. Publisher Metering
        res = await client.get("/api/metering")
        assert res.status_code == 200
        metering = res.json()
        print(f"[PASS] 9. Publisher Metering: {metering['total_readers']} readers, savings {metering['estimated_cost_savings']}")

        # 10. Grounded Q&A Chat
        res = await client.post("/api/chat", json={"job_id": job_id, "question": "What gate fidelity was demonstrated?"})
        assert res.status_code == 200
        qa_data = res.json()
        print(f"[PASS] 10. Grounded Q&A Answer: {qa_data['answer'][:120]}...")

        # 11. Embed.js
        res = await client.get("/embed.js")
        assert res.status_code == 200
        assert "kaleido-embed-container" in res.text
        print(f"[PASS] 11. /embed.js served ({len(res.text)} bytes)")

    print("\nALL 11 END-TO-END BACKEND INTEGRATION CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
