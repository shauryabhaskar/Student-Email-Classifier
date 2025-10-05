from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import sqlite3
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)

# --------------------------
# Step 1: Load tokenizer & model
# --------------------------
MODEL_PATH = "/Users/shauryabhaskar/student-email-classifier-project/backend/model/final_model"

tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH, local_files_only=True)

model.config.id2label = {
    0: "Admissions",
    1: "Examinations",
    2: "Fees",
    3: "General",
    4: "Hostel",
    5: "Technical"
}
model.config.label2id = {v: k for k, v in model.config.id2label.items()}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

# --------------------------
# Step 2: SQLite setup
# --------------------------
DB_PATH = "emails.db"

def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_text TEXT NOT NULL,
                predicted_category TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
        print("✅ Database and table created.")

init_db()

# --------------------------
# Step 3: Email sending setup
# --------------------------
department_emails = {
    "Admissions": "parthsrivastava3135k@gmail.com",
    "Examinations": "jayson.pp@christuniversity.in",
    "Fees": "jayson.pp@christuniversity.in",
    "General": "jayson.pp@christuniversity.in",
    "Hostel": "jayson.pp@christuniversity.in",
    "Technical": "jayson.pp@christuniversity.in"
}

SMTP_EMAIL = "shauryabhaskar26@gmail.com"      
SMTP_PASSWORD = "oltvwegqlwgahhpe"      

def send_email(to_email, subject, body):
    msg = MIMEMultipart()
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False

# --------------------------
# Step 4: Prediction function
# --------------------------
def predict_email_category(emails):
    if isinstance(emails, str):
        emails = [emails]

    inputs = tokenizer(emails, truncation=True, padding=True, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        preds = torch.argmax(outputs.logits, dim=-1)

    results = []
    for email, pred in zip(emails, preds):
        category = model.config.id2label[pred.item()]
        results.append({"email": email, "predicted_category": category})
    return results

# --------------------------
# Step 5: Flask routes
# --------------------------
@app.route("/")
def home():
    return "Email Classifier API with email forwarding ✅"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "emails" not in data:
        return jsonify({"error": "Please provide 'emails' in JSON body"}), 400

    emails = data["emails"]
    predictions = predict_email_category(emails)

    # Save predictions to SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for pred in predictions:
        cursor.execute(
            "INSERT INTO emails (email_text, predicted_category) VALUES (?, ?)",
            (pred["email"], pred["predicted_category"])
        )
    conn.commit()
    conn.close()

    # Send email to department
    for pred in predictions:
        dept_email = department_emails.get(pred["predicted_category"])
        if dept_email:
            send_email(
                to_email=dept_email,
                subject=f"New Student Query: {pred['predicted_category']}",
                body=pred["email"]
            )

    return jsonify(predictions)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
