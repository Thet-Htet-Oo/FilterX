import os
import re
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FilterX-AI")

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Model paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "comment_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

# Load local ML model and vectorizer for Stage 4 fallback
try:
    local_model = joblib.load(MODEL_PATH)
    local_vectorizer = joblib.load(VECTORIZER_PATH)
    logger.info("Local fallback model and vectorizer loaded successfully.")
except Exception as e:
    logger.warning(f"Warning: Could not load local ML model: {e}")
    local_model = None
    local_vectorizer = None

# Initialize Gemini Client if API key is present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()
gemini_client = None

if GEMINI_API_KEY and not GEMINI_API_KEY.lower().startswith("your_"):
    try:
        from google import genai
        from google.genai import types
        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=10000)
        )
        logger.info(f"Gemini client initialized with model: {GEMINI_MODEL} (timeout=10000ms)")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        gemini_client = None
else:
    logger.info("No valid GEMINI_API_KEY detected. AI service will operate using local ML model and rules.")


# -------------------------------------------------------------
# Stage 1: Text Sanitization & Normalization
# -------------------------------------------------------------
def clean_text(text: str) -> str:
    """
    Cleans text and decodes leetspeak/symbol obfuscations.
    """
    if not text:
        return ""
    text_lower = text.lower()

    replacements = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
        '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
        '!': 'i', '*': '', '_': '', '-': '', '+': '',
        '(': '', ')': '', '[': '', ']': '', '{': '', '}': '',
        '#': '', '%': '', '^': '', '&': '', '~': '', '`': '',
    }
    for k, v in replacements.items():
        text_lower = text_lower.replace(k, v)

    # Replace non-alphabetic and non-Myanmar characters with space
    # Keep Myanmar Unicode range: \u1000-\u109F
    cleaned = re.sub(r'[^a-z\u1000-\u109F\s]', ' ', text_lower)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


# -------------------------------------------------------------
# Stage 2: Deterministic Fast-Path Checks
# -------------------------------------------------------------
# Unambiguous Myanmar slang/acronyms and phrases to hard-block
# NOTE: Standalone "lee" is intentionally EXCLUDED so names like "Bruce Lee" or "Hi Lee"
# pass to Stage 3 for contextual evaluation.
MYANMAR_UNAMBIGUOUS_PATTERNS = [
    r"\bkmkl\b",          # Acronym from comments.csv
    r"\blee\s+(?:pl|par|pal|lar|lo|ma\s+lo|hcope)\b",  # Unambiguous compound slurs
    r"\bm\s*a\s*l\b",     # Acronym
    r"စောက်\s*ဖုတ်",
    r"စောက်\s*ရူး",
    r"မအေ\s*လိုး",
    r"လီး\s*ပဲ",
    r"လီး\s*လား",
    r"လီး\s*စုပ်",
    r"ကမြင်း\s*မ",
]

SEVERE_SLURS = [
    r"\b(?:nigger|nigga|faggot|cunt)\b",
]

def check_deterministic_hard_rules(text: str, cleaned_text: str):
    """
    Stage 2: Checks for unambiguous slurs, severe hate speech, and Myanmar acronyms.
    Returns dict if triggered, otherwise None.
    """
    # 1. Myanmar compound slurs and acronyms
    for pattern in MYANMAR_UNAMBIGUOUS_PATTERNS:
        if re.search(pattern, cleaned_text, re.IGNORECASE) or re.search(pattern, text, re.IGNORECASE):
            return {
                "result": "Toxic",
                "offensive": 1,
                "confidence": 1.0,
                "note": "Unambiguous Myanmar slang/acronym detected"
            }

    # 2. Severe slurs
    for pattern in SEVERE_SLURS:
        if re.search(pattern, cleaned_text, re.IGNORECASE):
            return {
                "result": "Toxic",
                "offensive": 1,
                "confidence": 1.0,
                "note": "Severe prohibited slur detected"
            }

    return None


# -------------------------------------------------------------
# Stage 3: Context-Aware LLM Evaluation (Gemini Flash)
# -------------------------------------------------------------
LLM_SYSTEM_PROMPT = """You are an expert multilingual content moderation and text safety classifier for FilterX.
Analyze the user text and determine if it is "Toxic" (offensive: 1) or "Clean" (offensive: 0).

CRITICAL CLASSIFICATION RULES:

1. BENIGN INTENSIFIERS & VULGAR SLANG (CLEAN):
   Vulgar words used purely for positive emphasis, excitement, enthusiasm, or casual benign reinforcement WITHOUT being an attack, threat, or insult MUST be classified as Clean (offensive: 0).
   Examples: "fking good", "fucking awesome", "fking cool", "damn fine", "shit was fire", "that's sick bro".

2. IDIOMS, PRAISE & FIGURATIVE SPEECH (CLEAN):
   Common figurative idioms or praise that contain violent or aggressive words literally MUST be classified as Clean (offensive: 0).
   Examples: "break a leg", "you killed it in that presentation", "this cake is to die for", "hit the road", "i'm dead (from laughter)".

3. PROPER NAMES & PERSON NAMES (CLEAN):
   Normal names such as "Bruce Lee", "Stan Lee", "Hi Lee", "Lee Min Ho" MUST be classified as Clean (offensive: 0).

4. STANDALONE PROFANITY (TOXIC):
   Isolated vulgar words or aggressive outbursts with no positive or benign modifier (e.g., "fking", "fuck", "shit", "bitch", "asshole" written alone or as an unsolicited aggressive remark) MUST be classified as Toxic (offensive: 1).

5. TARGETED ABUSE, HARASSMENT & INSULTS (TOXIC):
   Any vulgarity, slurs, or derogatory remarks directed at someone to demean, insult, harass, or belittle them MUST be classified as Toxic (offensive: 1).
   Examples: "you're a fking idiot", "worthless piece of shit", "shut up moron", "bitch", "loser", "f*ck you".

6. THREATS, VIOLENCE & SELF-HARM (TOXIC):
   Direct or indirect threats of physical violence, harm, or suicide encouragement MUST be classified as Toxic (offensive: 1).
   Examples: "I will break your leg", "kill yourself", "go die in a hole", "hope you die".

7. MYANMAR TRANSLITERATED SLANG (TOXIC):
   When "lee" or "kmkl" is used as an insult, vulgar slang, or offensive acronym in a Myanmar/Burmese context (e.g. "lee", "lee pl"), classify as Toxic (offensive: 1).

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema:
{
  "result": "Toxic" or "Clean",
  "offensive": 1 or 0,
  "confidence": float between 0.0 and 1.0,
  "note": "Short rationale for the classification"
}"""

def evaluate_context_llm(text: str):
    """
    Stage 3: Context-Aware LLM evaluation using Gemini Flash with BLOCK_NONE safety settings,
    zero thinking budget for sub-second speed, and automatic model fallback.
    """
    if not gemini_client:
        return None

    try:
        from google.genai import types

        # Explicitly configure safety settings to BLOCK_NONE across all categories
        # so Gemini evaluates the user text rather than having the API call blocked.
        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
        ]

        config = types.GenerateContentConfig(
            system_instruction=LLM_SYSTEM_PROMPT,
            temperature=0.0,
            response_mime_type="application/json",
            safety_settings=safety_settings,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            http_options=types.HttpOptions(timeout=10000)
        )

        models_to_try = [GEMINI_MODEL]
        if GEMINI_MODEL != "gemini-3.1-flash-lite":
            models_to_try.append("gemini-3.1-flash-lite")

        response = None
        last_error = None

        for model_name in models_to_try:
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=text,
                    config=config,
                )
                if response and response.text:
                    break
            except Exception as err:
                last_error = err
                logger.warning(f"Gemini model '{model_name}' evaluation failed: {err}")
                continue

        if response and response.text:
            parsed = json.loads(response.text)
            result = parsed.get("result", "Clean")
            offensive = int(parsed.get("offensive", 0))
            confidence = float(parsed.get("confidence", 0.9))
            note = str(parsed.get("note", "Gemini context evaluation"))
            return {
                "result": "Toxic" if offensive == 1 or result == "Toxic" else "Clean",
                "offensive": offensive,
                "confidence": confidence,
                "note": note
            }
        else:
            logger.warning(f"All Gemini models failed ({last_error}). Falling back to Stage 4 local ML fallback.")
            return None

    except Exception as e:
        logger.warning(f"Gemini LLM evaluation failed or timed out: {e} ({type(e).__name__}). Falling back to Stage 4.")
        return None


# -------------------------------------------------------------
# Stage 4: Resilient Local ML & Heuristic Fallback
# -------------------------------------------------------------
COMMON_IDIOMS = [
    "to die for", "kill two birds", "break a leg", "i'm dead", "you killed it",
    "piece of cake", "blessing in disguise", "hit the road", "sick beat", "that's sick"
]

BENIGN_INTENSIFIER_PATTERNS = [
    r"\bf(?:u|k|ck|uck)?ing\s+(?:good|great|awesome|cool|amazing|wonderful|nice|fine|well|best)\b",
    r"\bdamn\s+(?:good|fine|cool|awesome|great|nice)\b",
    r"\bbruce\s+lee\b",
    r"\bstan\s+lee\b",
    r"\bhi\s+lee\b",
]

STANDALONE_VULGAR_WORDS = {
    "fking", "fuck", "fucking", "shit", "bitch", "asshole", "bastard",
    "retard", "moron", "idiot", "dick", "pussy", "cunt", "whore", "slut"
}

LOCAL_TOXIC_PATTERNS = [
    r"\bf(?:u|ck|\*|k)?ck?\s+you\b",
    r"\bkill\s+yourself\b",
    r"\bgo\s+die\b",
    r"\bhope\s+you\s+die\b",
    r"\bpiece\s+of\s+shit\b",
    r"\bshut\s+up\s+moron\b",
    r"\bworthless\s+piece\b",
    r"\bdisgusting\s+trash\b"
]

def evaluate_local_fallback(text: str, cleaned_text: str):
    """
    Stage 4: Local heuristic and ML model fallback if LLM is unavailable or times out.
    """
    text_lower = text.lower()

    # Check benign intensifiers & known names
    for pattern in BENIGN_INTENSIFIER_PATTERNS:
        if re.search(pattern, text_lower) or re.search(pattern, cleaned_text):
            return {
                "result": "Clean",
                "offensive": 0,
                "confidence": 0.85,
                "note": "Benign intensifier / name (local rule)"
            }

    # Check standalone profanity with no positive context
    words = cleaned_text.split()
    if len(words) == 1 and words[0] in STANDALONE_VULGAR_WORDS:
        return {
            "result": "Toxic",
            "offensive": 1,
            "confidence": 0.95,
            "note": "Standalone profanity (local rule)"
        }

    # Check common idioms
    for idiom in COMMON_IDIOMS:
        if idiom in text_lower:
            return {
                "result": "Clean",
                "offensive": 0,
                "confidence": 0.1,
                "note": "Idiomatic expression (local rule)"
            }

    # Check local abusive phrases & threats
    for pattern in LOCAL_TOXIC_PATTERNS:
        if re.search(pattern, text_lower) or re.search(pattern, cleaned_text):
            return {
                "result": "Toxic",
                "offensive": 1,
                "confidence": 0.95,
                "note": "Abusive expression (local rule)"
            }

    # Use Scikit-Learn model if available
    if local_model and local_vectorizer:
        try:
            vector = local_vectorizer.transform([cleaned_text])
            probabilities = local_model.predict_proba(vector)
            toxic_probability = float(probabilities[0][1])

            # Safety Rule: The 524-row CountVectorizer model drifts to ~0.50-0.55 on unseen neutral words (e.g., 'kpop').
            # To prevent false positives:
            # - Require toxic_probability >= 0.85 for general toxicity
            # - OR require toxic_probability >= 0.60 combined with an explicit toxic root word.
            toxic_roots = {
                "fuck", "fck", "fuk", "shit", "sh1t", "bitch", "btch", "cunt",
                "dick", "pussy", "asshole", "retard", "moron", "idiot",
                "kill", "die", "bastard", "nigger", "nigga", "faggot"
            }
            has_toxic_token = any(w in toxic_roots for w in cleaned_text.split())

            is_toxic = (toxic_probability >= 0.85) or (toxic_probability >= 0.60 and has_toxic_token)

            if is_toxic:
                return {
                    "result": "Toxic",
                    "offensive": 1,
                    "confidence": toxic_probability,
                    "note": "Local ML classifier (fallback)"
                }
            else:
                return {
                    "result": "Clean",
                    "offensive": 0,
                    "confidence": toxic_probability,
                    "note": "Local ML classifier (fallback)"
                }
        except Exception as e:
            logger.error(f"Error in local model evaluation: {e}")

    # Default safe fallback
    return {
        "result": "Clean",
        "offensive": 0,
        "confidence": 0.5,
        "note": "Default clean fallback"
    }


# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field in JSON"}), 400

        text = data["text"]
        if text is None:
            return jsonify({"error": "Text cannot be null"}), 400

        text_str = str(text)
        if not text_str.strip():
            # Empty / whitespace comment
            return jsonify({
                "result": "Clean",
                "offensive": 0,
                "confidence": 0.0,
                "note": "Empty text"
            }), 200

        # Stage 1: Text Sanitization & Normalization
        cleaned_text = clean_text(text_str)

        # Stage 2: Deterministic Fast-Path Check
        hard_rule_result = check_deterministic_hard_rules(text_str, cleaned_text)
        if hard_rule_result:
            return jsonify(hard_rule_result), 200

        # Stage 3: Context-Aware LLM Evaluation (Gemini)
        llm_result = evaluate_context_llm(text_str)
        if llm_result:
            return jsonify(llm_result), 200

        # Stage 4: Local ML Model / Heuristic Fallback
        fallback_result = evaluate_local_fallback(text_str, cleaned_text)
        return jsonify(fallback_result), 200

    except Exception as e:
        logger.error(f"Internal server error in /predict: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    engine_status = f"Gemini ({GEMINI_MODEL})" if gemini_client else "Local Scikit-Learn Model & Rules"
    return jsonify({
        "status": "Online",
        "service": "FilterX Moderation API",
        "active_engine": engine_status,
        "endpoint": "POST /predict"
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1")
    logger.info(f"Starting FilterX Moderation API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
