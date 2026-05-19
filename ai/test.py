import joblib
import re
import requests
import json
import time
from typing import Dict, Any

# URL of your running Flask API
API_URL = "http://127.0.0.1:5000/predict"

# Optional: Set a flag to run the interactive test
RUN_INTERACTIVE_TEST = True

# A dictionary of test cases organized by category
test_cases: Dict[str, Dict[str, Any]] = {
    "Clearly Toxic": {
        "comments": [
            "Fuck you bitch",
            "Go die in a hole",
            "Kill yourself",
            "You're a worthless piece of shit",
            "You're a fucking idiot",
            "I hope you die",
            "You're trash",
            "Shut up moron",
            "You are a disgusting fool"
        ],
        "expected_class": "Toxic"
    },
    "Clearly Clean": {
        "comments": [
            "This is a great day!",
            "Thank you so much, this was very helpful.",
            "I love this amazing app.",
            "Have a wonderful weekend.",
            "You are a very kind person."
        ],
        "expected_class": "Clean"
    },
    "Ambiguous/Idiomatic": {
        "comments": [
            "This cake is to die for",  # Idiom
            "You killed it in that presentation", # Idiom
            "That's a sick beat", # Slang
            "I'm dead, that was so funny" # Slang
        ],
        "expected_class": "Clean"
    },
    "Leetspeak/Evasion": {
        "comments": [
            "F*ck you",
            "Sh1t head",
            "You're a b*tch",
            "Go d1e",
            "K1ll yourself",
            "You're a ret*rd",
            "Stup1d idiot",
            "M0ron"
        ],
        "expected_class": "Toxic"
    },
    "Mixed Toxicity (potentially clean)": {
        "comments": [
            "I hate my homework, not you", # Mixed toxic and non-toxic intent
            "I feel so stupid for not getting this",
            "You are so brilliant it's disgusting", # Sarcasm/irony
            "You suck at basketball, but you're a great friend" # Mixed
        ],
        "expected_class": "Clean"
    }
}

def run_tests():
    """Runs a comprehensive suite of tests against the API and reports the results."""
    print("🧪 COMPREHENSIVE MODEL TESTING")
    print("=" * 60)
    
    total_tests = sum(len(d["comments"]) for d in test_cases.values())
    passed_tests = 0
    
    for category, data in test_cases.items():
        print(f"\n--- {category} (Expecting: {data['expected_class']}) ---")
        
        for comment in data["comments"]:
            try:
                response = requests.post(API_URL, json={"text": comment}, timeout=5)
                
                if response.status_code == 200:
                    result = response.json()
                    is_correct = result.get("result") == data["expected_class"]
                    
                    if is_correct:
                        passed_tests += 1
                        status_msg = "✅ PASS"
                    else:
                        status_msg = "❌ FAIL"
                        
                    print(f"[{status_msg}] Input: '{comment}'")
                    print(f"  Response: {json.dumps(result, indent=2)}")
                else:
                    print(f"⚠️ ERROR: API returned status code {response.status_code} for '{comment}'")
            except requests.exceptions.RequestException as e:
                print(f"⚠️ ERROR: Could not connect to API. Is it running at {API_URL}?")
                print(f"  Details: {e}")
                return # Exit on connection failure
            
            time.sleep(0.1) # Small delay to avoid flooding the API

    print("\n" + "=" * 60)
    print(f"🏁 Test Suite Complete: {passed_tests}/{total_tests} tests passed.")
    if passed_tests < total_tests:
        print("💡 The model may need more diverse training data or a refined cleaning function.")
    
def run_interactive():
    """Allows a user to interactively test the model with their own input."""
    print("\n--- Interactive Test Mode ---")
    print("Type any sentence to test the model, or 'quit' to exit.")
    
    while True:
        user_input = input("\n> Enter a sentence: ")
        if user_input.lower() == "quit":
            break
        
        try:
            response = requests.post(API_URL, json={"text": user_input}, timeout=5)
            if response.status_code == 200:
                print(json.dumps(response.json(), indent=2))
            else:
                print(f"Error {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Could not connect to API. Is it running at {API_URL}?")
            print(f"Details: {e}")
            break

if __name__ == "__main__":
    run_tests()
    if RUN_INTERACTIVE_TEST:
        run_interactive()
