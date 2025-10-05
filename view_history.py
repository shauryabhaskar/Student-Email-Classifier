import sqlite3

DB_PATH = "emails.db"   # make sure this matches your DB filename

def show_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email_text, predicted_category, created_at FROM emails ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    print("\n--- Email History ---\n")
    for r in rows:
        print(f"ID: {r[0]}")
        print(f"Email: {r[1]}")
        print(f"Category: {r[2]}")
        print(f"Created At: {r[3]}")
        print("-" * 40)

if __name__ == "__main__":
    show_history()
