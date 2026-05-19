import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import re

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

# Load your dataset from a CSV file named 'comments.csv'
try:
    df = pd.read_csv('comments.csv')
    # Ensure column names are correct
    if 'text' not in df.columns or 'label' not in df.columns:
        print("Error: The CSV file must have 'text' and 'label' columns.")
        exit()
except FileNotFoundError:
    print("Error: 'comments.csv' not found. Please make sure the file is in the same directory.")
    exit()

# Clean the text
df["cleaned_text"] = df["text"].apply(clean_text)

# Convert text to vectors with better parameters
vectorizer = CountVectorizer(
    ngram_range=(1, 3),  # Use 1-3 word combinations
    max_features=5000,   # Limit vocabulary size
    stop_words='english' # Remove common English words
)
X = vectorizer.fit_transform(df["cleaned_text"])
y = df["label"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train model with class weighting to handle imbalance
model = LogisticRegression(
    random_state=42,
    max_iter=1000,
    class_weight='balanced'
)
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model accuracy: {accuracy:.2f}")

# Save the trained model and vectorizer
joblib.dump(model, 'comment_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')

print("Model and vectorizer saved successfully!")
