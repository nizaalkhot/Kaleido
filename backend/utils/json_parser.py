import json
import re
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

def clean_and_parse_json(raw_text: str, default: Optional[Any] = None) -> Any:
    """
    Cleans markdown code fences, extracts embedded JSON strings,
    and returns parsed Python objects. If parsing fails, returns the default value.
    """
    if not raw_text:
        return default

    cleaned = raw_text.strip()

    # 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
    if "```" in cleaned:
        # Match content within ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()

    # 2. Direct JSON parse attempt
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Substring extraction for outermost JSON object or array
    try:
        start_obj = cleaned.find("{")
        end_obj = cleaned.rfind("}")
        start_arr = cleaned.find("[")
        end_arr = cleaned.rfind("]")

        # Find which comes first: object or array
        candidates = []
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            candidates.append((start_obj, end_obj + 1))
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            candidates.append((start_arr, end_arr + 1))

        if candidates:
            # Pick earliest starting delimiter
            candidates.sort(key=lambda x: x[0])
            s, e = candidates[0]
            sub = cleaned[s:e]
            return json.loads(sub)
    except Exception as e:
        logger.warning(f"Failed to extract JSON from LLM response substring: {e}")

    logger.warning("All JSON parsing attempts failed; returning default.")
    return default
