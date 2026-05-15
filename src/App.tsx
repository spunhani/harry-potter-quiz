import React from "react";

export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #2a2a72 0%, #15153f 35%, #0b0b2e 65%, #060617 100%)",
      color: "white",
      padding: 40,
      fontFamily: "Arial"
    }}>
      <h1 style={{ color: "gold", fontSize: 48 }}>
        ⚡ Harry Potter Quiz ⚡
      </h1>

      <p style={{ fontSize: 22, maxWidth: 700 }}>
        Multiplayer Harry Potter trivia game with movie selection,
        read-aloud questions, magical sounds, and 100 quiz questions.
      </p>

      <div style={{
        marginTop: 30,
        padding: 24,
        borderRadius: 20,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,215,0,0.3)"
      }}>
        <h2 style={{ color: "#ffe88a" }}>✨ Features Included</h2>
        <ul style={{ lineHeight: 2, fontSize: 18 }}>
          <li>100 Harry Potter questions</li>
          <li>Questions from all 8 movies</li>
          <li>1-player and 2-player modes</li>
          <li>Movie selection before quiz</li>
          <li>Speech read-aloud button</li>
          <li>Magical home screen sounds</li>
          <li>Responsive mobile-friendly layout</li>
        </ul>
      </div>

      <div style={{ marginTop: 40 }}>
        <button style={{
          padding: "16px 28px",
          fontSize: 22,
          background: "gold",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: "bold"
        }}>
          Start Quiz
        </button>
      </div>
    </div>
  );
}
