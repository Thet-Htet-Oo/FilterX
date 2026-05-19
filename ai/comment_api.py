from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Load the model and vectorizer
try:
    model = joblib.load("comment_model.pkl")
    vectorizer = joblib.load("vectorizer.pkl")
except FileNotFoundError:
    print("Model or vectorizer files not found. Please run train_model.py first.")
    exit()

def clean_text(text):
    """
    Cleans and preprocesses text to prepare it for the model.
    Includes more robust leetspeak and symbol handling.
    """
    text = text.lower()
    
    # More comprehensive leetspeak and symbol replacements
    replacements = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
        '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
        '!': 'i', '*': '', '_': '', '-': '', '+': '',
        '(': '', ')': '', '[': '', ']': '', '{': '', '}': '',
        '#': '', '%': '', '^': '', '&': '', '~': '', '`': '',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
        
    # Remove all non-alphabetic characters and replace with a single space
    text = re.sub(r'[^a-z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

# Check for common idioms to reduce false positives
def is_idiomatic_expression(text):
    idioms = [
        "to die for", "kill two birds", "break a leg", "i'm dead", "you killed it",
        "piece of cake", "blessing in disguise", "hit the road", "sick beat", "that's sick"
    ]
    cleaned_text = text.lower()
    for idiom in idioms:
        if idiom in cleaned_text:
            return True
    return False

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field in JSON"}), 400

        # Check for idiomatic expressions first
        if is_idiomatic_expression(data["text"]):
            return jsonify({
                "result": "Clean",
                "offensive": 0,
                "confidence": 0.1,
                "note": "Idiomatic expression"
            })
        
        # Use the machine learning model for all other predictions
        comment = clean_text(data["text"])
        vector = vectorizer.transform([comment])
        
        probabilities = model.predict_proba(vector)
        toxic_probability = probabilities[0][1]
        
        confidence_threshold = 0.45
        
        if toxic_probability >= confidence_threshold:
            result = "Toxic"
            offensive = 1
        else:
            result = "Clean" 
            offensive = 0

        return jsonify({
            "result": result,
            "offensive": offensive,
            "confidence": float(toxic_probability)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "Toxic Comment Filter API is running!"

if __name__ == "__main__":
    app.run(debug=True)
