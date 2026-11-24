import requests
import json
import time
from typing import Dict, Any

API_URL = "http://127.0.0.1:5000/predict"

# Test suite organized by category
test_cases: Dict[str, Dict[str, Any]] = {
    "Standalone Profanity (Must be Toxic)": {
        "comments": [
            "fking",
            "fuck",
            "shit",
            "bitch",
            "asshole"
        ],
        "expected_class": "Toxic"
    },
    "Benign Intensifiers (Must be Clean)": {
        "comments": [
            "This is fking good!",
            "This is fucking awesome",
            "Damn good performance",
            "That meal was fking great",
            "This car is fking cool"
        ],
        "expected_class": "Clean"
    },
    "Idioms & Figurative Speech (Must be Clean)": {
        "comments": [
            "Break a leg tonight!",
            "You killed it in that presentation",
            "This cake is to die for",
            "That's a sick beat bro",
            "I'm dead, that joke was hilarious"
        ],
        "expected_class": "Clean"
    },
    "Proper Names with Lee (Must be Clean)": {
        "comments": [
            "Bruce Lee is an icon",
            "Hi Lee, how are you doing?",
            "Stan Lee created amazing characters"
        ],
        "expected_class": "Clean"
    },
    "Direct Threats & Harm (Must be Toxic)": {
        "comments": [
            "I will break your leg",
            "Kill yourself",
            "Go die in a hole",
            "I hope you die",
            "I'm going to kill you"
        ],
        "expected_class": "Toxic"
    },
    "Targeted Abuse & Insults (Must be Toxic)": {
        "comments": [
            "You're a fking idiot",
            "You are a worthless piece of shit",
            "Fuck you bitch",
            "Shut up moron",
            "You are disgusting trash"
        ],
        "expected_class": "Toxic"
    },
    "Myanmar Slang & Acronyms (Must be Toxic)": {
        "comments": [
            "kmkl",
            "lee pl",
            "lee lar",
            "lee lo"
        ],
        "expected_class": "Toxic"
    },
    "Leetspeak / Evasion (Must be Toxic)": {
        "comments": [
            "F*ck you",
            "Sh1t head",
            "K1ll yourself",
            "You're a b*tch",
            "Stup1d idiot"
        ],
        "expected_class": "Toxic"
    },
    "Everyday Positive / Clean": {
        "comments": [
            "Thank you so much for your help!",
            "Have a great weekend everyone.",
            "I really love this application.",
            "Good morning, hope you have a nice day.",
            "Do you know kpop ?",
            "wanna have a discussion about this ?"
        ],
        "expected_class": "Clean"
    }
}

def run_tests():
    print("=" * 70)
    print("FilterX Moderation Test Suite")
    print("=" * 70)

    total_tests = sum(len(d["comments"]) for d in test_cases.values())
    passed_tests = 0
    failed_cases = []

    for category, data in test_cases.items():
        expected = data["expected_class"]
        print(f"\n--- {category} (Expecting: {expected}) ---")

        for comment in data["comments"]:
            try:
                response = requests.post(API_URL, json={"text": comment}, timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    actual = result.get("result")
                    is_correct = (actual == expected)

                    if is_correct:
                        passed_tests += 1
                        status_msg = "PASS"
                    else:
                        status_msg = "FAIL"
                        failed_cases.append((comment, expected, actual, result.get("note")))

                    note = result.get("note", "")
                    conf = result.get("confidence", 0)
                    print(f"[{status_msg}] '{comment}' -> {actual} (conf: {conf:.2f}, note: {note})")
                else:
                    print(f"[ERROR] Status {response.status_code} for '{comment}': {response.text}")
                    failed_cases.append((comment, expected, f"HTTP {response.status_code}", ""))
            except requests.exceptions.RequestException as e:
                print(f"[CONNECTION ERROR] Could not reach API at {API_URL}: {e}")
                print("Make sure comment_api.py is running on port 5000.")
                return

            time.sleep(0.05)

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
    if failed_cases:
        print("\nFailed Cases:")
        for text, exp, act, note in failed_cases:
            print(f"  - '{text}': Expected {exp}, Got {act} ({note})")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
