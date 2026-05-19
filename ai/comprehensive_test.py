# comprehensive_test.py
import joblib
import re
import pandas as pd

# Update your clean_text function to handle leetspeak better
def clean_text(text):
    text = text.lower()
    
    # Better leetspeak handling
    replacements = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
        '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
        '!': 'i', '*': '', '_': '', '-': '', '+': ''
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    
    # Remove special characters but keep spaces
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
# Load model
model = joblib.load('comment_model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

# Test cases organized by category
test_cases = {
    "Clearly Toxic": [
        "Fuck you bitch",
        "Go die in a hole",
        "Kill yourself",
        "You're a worthless piece of shit",
        "You're a fucking idiot",
        "I hope you die",
        "You're trash",
        "Shut up moron"
    ],
    "Clearly Clean": [
        "Thank you for your help",
        "Great job on the project",
        "I appreciate your effort",
        "You are amazing",
        "Well done everyone",
        "Congratulations on your success",
        "Have a nice day",
        "You're very talented"
    ],
    "Borderline/Idiomatic": [
        "This is stupid simple",
        "That movie was to die for",
        "What the hell are you doing?",
        "Break a leg on your performance",
        "This is crazy good",
        "You killed it in that presentation",
        "This is the bomb",
        "That's sick bro"
    ],
    "Leetspeak/Evasion": [
        "F*ck you",
        "Sh1t head",
        "You're a b*tch",
        "Go d1e",
        "K1ll yourself",
        "You're a ret*rd",
        "Stup1d idiot",
        "M0ron"
    ]
}

print("🧪 COMPREHENSIVE MODEL TESTING")
print("=" * 60)

for category, comments in test_cases.items():
    print(f"\n{category}:")
    print("-" * 40)
    
    for comment in comments:
        cleaned = clean_text(comment)
        vector = vectorizer.transform([cleaned])
        proba = model.predict_proba(vector)
        toxic_prob = proba[0][1]
        result = "Toxic" if toxic_prob >= 0.6 else "Clean"
        
        # Color coding
        if result == "Toxic":
            color_start = "\033[91m"  # Red
        else:
            color_start = "\033[92m"  # Green
            
        print(f"{color_start}{comment:<40} -> {result:6} ({toxic_prob:.3f})\033[0m")

# Test some edge cases
print(f"\n{'Edge Cases:'}")
print("-" * 40)
edge_cases = [
    "hello",
    "ok",
    "yes",
    "no", 
    "maybe",
    "why",
    "how",
    "test"
]

for comment in edge_cases:
    cleaned = clean_text(comment)
    vector = vectorizer.transform([cleaned])
    proba = model.predict_proba(vector)
    toxic_prob = proba[0][1]
    result = "Toxic" if toxic_prob >= 0.6 else "Clean"
    
    color_start = "\033[91m" if result == "Toxic" else "\033[92m"
    print(f"{color_start}{comment:<40} -> {result:6} ({toxic_prob:.3f})\033[0m")