import React, { useState } from "react";

const categoryColors = {
  Admissions: "#FF6B6B",
  Examinations: "#FFA94D",
  Hostel: "#4D96FF",
  Fees: "#51CF66",
  Technical: "#845EF7",
  General: "#FF922B"
};

const EmailClassifier = () => {
  const [emails, setEmails] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    // Split by blank line 
    const emailList = emails
      .split(/\n\s*\n/) // blank line = new email
      .map(e => e.trim())
      .filter(e => e !== "");

    if (emailList.length === 0) return;

    setLoading(true);
    setResults([]);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setResults(data);

      alert("✅ Emails classified and sent to departments!");
    } catch (err) {
      console.error(err);
      setResults([{ email: "Error", predicted_category: "Failed" }]);
      alert("❌ Something went wrong. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = results.map(r => `${r.email} → ${r.predicted_category}`).join("\n");
    navigator.clipboard.writeText(text);
    alert("Results copied to clipboard!");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>📧 Student Email Classifier</h1>

        <textarea
          placeholder="✉️Paste one or more emails.Separate multiple emails with a blank line."
          value={emails}
          onChange={e => setEmails(e.target.value)}
          style={styles.textarea}
        />

        <button
          onClick={handleClassify}
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <span className="loader" style={styles.loader}></span> Processing...
            </span>
          ) : (
            "Classify & Send Emails"
          )}
        </button>

        {results.length > 0 && (
          <div style={styles.resultWrapper}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={styles.resultTitle}>Results:</h2>
              <button onClick={handleCopy} style={styles.copyButton}>📋 Copy</button>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={idx % 2 === 0 ? styles.evenRow : styles.oddRow}>
                      <td title={r.email}>{r.email.slice(0, 50)}{r.email.length > 50 ? "..." : ""}</td>
                      <td>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: categoryColors[r.predicted_category] || "#999"
                          }}
                        >
                          {r.predicted_category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #ece9e6, #ffffff)",
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "800px",
    padding: "40px",
    borderRadius: "25px",
    background: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
    backdropFilter: "blur(12px)",
    textAlign: "center",
    transition: "0.3s",
  },
  title: {
    marginBottom: "30px",
    fontSize: "34px",
    fontWeight: "700",
    color: "#333",
  },
  textarea: {
    width: "100%",
    height: "160px",
    padding: "18px",
    fontSize: "16px",
    borderRadius: "15px",
    border: "1px solid #ccc",
    marginBottom: "20px",
    resize: "none",
    outline: "none",
    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  button: {
    width: "100%",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "700",
    borderRadius: "15px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(90deg, #36D1DC, #5B86E5)",
    color: "#fff",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    transition: "all 0.3s ease",
  },
  loader: {
    width: "18px",
    height: "18px",
    border: "3px solid #fff",
    borderTop: "3px solid rgba(255,255,255,0.3)",
    borderRadius: "50%",
    marginRight: "10px",
    animation: "spin 1s linear infinite"
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" }
  },
  resultWrapper: {
    marginTop: "35px",
    textAlign: "center",
  },
  resultTitle: {
    marginBottom: "15px",
    fontSize: "24px",
    color: "#444",
  },
  tableContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    borderRadius: "15px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "15px",
  },
  evenRow: {
    backgroundColor: "#f9f9f9",
    transition: "0.2s",
    cursor: "default"
  },
  oddRow: {
    backgroundColor: "#ffffff",
    transition: "0.2s",
    cursor: "default"
  },
  badge: {
    display: "inline-block",
    padding: "8px 18px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    borderRadius: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  copyButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "15px",
    border: "none",
    cursor: "pointer",
    background: "#51CF66",
    color: "#fff",
    transition: "0.3s",
  }
};

export default EmailClassifier;
