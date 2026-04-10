import React, { useMemo, useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type AnswerRecord = {
  question: string;
  selected: string;
  correct: string;
};

type SubjectTemplate = {
  q: string;
  answers: string[];
  names?: string[];
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuestions(count = 300): Question[] {
  const subjects: SubjectTemplate[] = [
    { q: "What house is {name} in?", names: ["Harry", "Hermione", "Ron"], answers: ["Gryffindor"] },
    { q: "What school do wizards attend?", answers: ["Hogwarts"] },
    { q: "What sport is played on broomsticks?", answers: ["Quidditch"] },
    { q: "Who is the headmaster of Hogwarts?", answers: ["Dumbledore"] },
    { q: "What animal delivers mail?", answers: ["Owl"] },
    { q: "Who is Harry's best friend?", answers: ["Ron & Hermione"] },
    { q: "What is the dark wizard's name?", answers: ["Voldemort"] },
    { q: "Who is the gamekeeper?", answers: ["Hagrid"] },
  ];

  const wrongOptions = [
    "Snape",
    "Dragon",
    "Cat",
    "Football",
    "Durmstrang",
    "Beauxbatons",
    "Goblin",
    "Phoenix",
  ];

  const result: Question[] = [];

  for (let i = 0; i < count; i += 1) {
    const template = subjects[Math.floor(Math.random() * subjects.length)];
    const correct = template.answers[Math.floor(Math.random() * template.answers.length)];

    let question = template.q;
    if (template.names) {
      const name = template.names[Math.floor(Math.random() * template.names.length)];
      question = question.replace("{name}", name);
    }

    const options = new Set<string>([correct]);
    while (options.size < 4) {
      options.add(wrongOptions[Math.floor(Math.random() * wrongOptions.length)]);
    }

    result.push({
      question,
      options: shuffleArray(Array.from(options)),
      answer: correct,
    });
  }

  return result;
}

function getFreshRound(questionCount = 10): Question[] {
  const freshQuestions = generateQuestions(200);
  const uniqueQuestions = Array.from(new Map(freshQuestions.map((q) => [q.question, q])).values());
  return shuffleArray(uniqueQuestions).slice(0, questionCount);
}

function runLightweightTests(): void {
  const sample = generateQuestions(20);
  console.assert(sample.length === 20, "generateQuestions should create the requested count");
  console.assert(sample.every((q) => q.options.length === 4), "Each question should have 4 options");
  console.assert(sample.every((q) => q.options.includes(q.answer)), "Each question should include the correct answer");

  const round = getFreshRound(10);
  console.assert(round.length <= 10, "Round size should not exceed requested size");
  console.assert(new Set(round.map((q) => q.question)).size === round.length, "Round questions should be unique");
  console.assert(round.every((q) => q.options.includes(q.answer)), "Round questions should include the correct answer");
}

runLightweightTests();

export default function HarryPotterQuizSimple() {
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [screen, setScreen] = useState<"home" | "quiz" | "result">("home");
  const [activeHomeCard, setActiveHomeCard] = useState<string | null>(null);

  const current = quizQuestions[index];
  const cardTitles = ["Characters", "Spells", "Creatures", "Hogwarts"] as const;
  const _lastScoreLabel = useMemo(() => `${score}`, [score]);

  function startGame() {
    setQuizQuestions(getFreshRound(10));
    setScreen("quiz");
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswers([]);
  }

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
  }

  function next() {
    if (!selected || !current) return;

    const updatedAnswers: AnswerRecord[] = [
      ...answers,
      { question: current.question, selected, correct: current.answer },
    ];
    setAnswers(updatedAnswers);

    if (index + 1 < quizQuestions.length) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      return;
    }

    const finalScore = updatedAnswers.filter((a) => a.selected === a.correct).length;
    setScore(finalScore);
    setScreen("result");
  }

  function goHome() {
    setScreen("home");
  }

  function playHomeCardSound(cardTitle: string) {
    setActiveHomeCard(cardTitle);
    window.setTimeout(() => {
      setActiveHomeCard((currentActive) => (currentActive === cardTitle ? null : currentActive));
    }, 280);

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const soundMap: Record<string, number[]> = {
        Characters: [440, 554.37, 659.25],
        Spells: [783.99, 1046.5, 1318.5],
        Creatures: [220, 246.94, 293.66],
        Hogwarts: [392, 523.25, 659.25, 783.99],
      };

      const notes = soundMap[cardTitle] || [523.25, 659.25, 783.99];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (cardTitle === "Spells") osc.type = "triangle";
        else if (cardTitle === "Creatures") osc.type = "square";
        else osc.type = "sine";

        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.0001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.05, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch (error) {
      console.error("Unable to play home card sound", error);
    }
  }

  if (screen === "home") {
    return (
      <div
        style={{
          minHeight: "100vh",
          color: "white",
          boxSizing: "border-box",
          background:
            "radial-gradient(circle at top, #2a2a72 0%, #15153f 35%, #0b0b2e 65%, #060617 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "32px 20px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.9,
            backgroundImage:
              "radial-gradient(circle, rgba(255,215,0,0.9) 1.2px, transparent 1.2px)",
            backgroundSize: "36px 36px",
            backgroundPosition: "0 0, 18px 18px",
          }}
        />

        <div style={{ position: "absolute", top: 80, left: 40, fontSize: 64, opacity: 0.18, transform: "rotate(-18deg)", pointerEvents: "none" }}>⚡</div>
        <div style={{ position: "absolute", top: 140, right: 60, fontSize: 54, opacity: 0.16, transform: "rotate(18deg)", pointerEvents: "none" }}>🪄</div>
        <div style={{ position: "absolute", bottom: 90, left: 70, fontSize: 52, opacity: 0.14, pointerEvents: "none" }}>🦉</div>
        <div style={{ position: "absolute", bottom: 70, right: 80, fontSize: 56, opacity: 0.14, pointerEvents: "none" }}>🏰</div>

        <div
          style={{
            position: "relative",
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,215,0,0.15)",
                border: "1px solid rgba(255,215,0,0.35)",
                color: "#ffe88a",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              Magical Movie Trivia for Kids
            </div>

            <h1
              style={{
                color: "gold",
                marginTop: 18,
                marginBottom: 12,
                fontSize: "clamp(38px, 7vw, 72px)",
                lineHeight: 1.02,
                textShadow: "0 0 18px rgba(255,215,0,0.22)",
              }}
            >
              ⚡ Harry Potter Quiz ⚡
            </h1>

            <p
              style={{
                fontSize: 20,
                lineHeight: 1.6,
                opacity: 0.95,
                maxWidth: 560,
                marginTop: 0,
              }}
            >
              Step into a magical world of Hogwarts, owls, broomsticks, and spells. Every round gives you 10 different questions, so each game feels fresh and fun.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 24,
                marginBottom: 26,
              }}
            >
              {["10 new questions each round", "Harry Potter themed fun", "See results at the end"].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    fontSize: 14,
                  }}
                >
                  ✨ {item}
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              style={{
                marginTop: 6,
                padding: "16px 28px",
                fontSize: 20,
                fontWeight: 700,
                background: "linear-gradient(180deg, #ffe27a 0%, #f2c94c 100%)",
                color: "#2a1600",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(242,201,76,0.28)",
              }}
            >
              Start Quiz
            </button>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,215,0,0.25)",
              borderRadius: 22,
              padding: 24,
              backdropFilter: "blur(8px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(124,0,0,0.95), rgba(179,0,0,0.9))",
                border: "2px solid gold",
                borderRadius: 18,
                padding: 22,
              }}
            >
              <div style={{ fontSize: 18, color: "#ffe88a", fontWeight: 700, marginBottom: 10 }}>
                Welcome to Hogwarts Quiz Night
              </div>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🧙‍♂️ 📚 🏰</div>
              <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
                Answer fun questions about famous characters, magical creatures, and wizard adventures.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              {cardTitles.map((title) => {
                const iconMap: Record<string, string> = {
                  Characters: "🧒",
                  Spells: "✨",
                  Creatures: "🦉",
                  Hogwarts: "🏰",
                };
                const isActive = activeHomeCard === title;

                return (
                  <button
                    key={title}
                    onClick={() => playHomeCardSound(title)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: isActive ? "rgba(255,215,0,0.22)" : "rgba(255,255,255,0.07)",
                      border: isActive ? "1px solid rgba(255,215,0,0.7)" : "1px solid rgba(255,255,255,0.12)",
                      textAlign: "center",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      boxShadow: isActive ? "0 0 18px rgba(255,215,0,0.28)" : "none",
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{iconMap[title]}</div>
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{title}</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.82 }}>
                      Tap for a magical sound
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "quiz") {
    return (
      <div
        style={{
          padding: 20,
          minHeight: "100vh",
          background: "linear-gradient(135deg,#3b0000,#7a0000,#b30000)",
          color: "white",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#8b0000",
            padding: 20,
            borderRadius: 12,
            border: "2px solid gold",
          }}
        >
          <h2 style={{ color: "gold", marginTop: 0 }}>Question {index + 1}</h2>
          <p style={{ fontSize: 22, marginBottom: 0 }}>{current?.question}</p>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {current?.options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              style={{
                width: "100%",
                padding: 18,
                fontSize: 18,
                background: selected === opt ? "gold" : "white",
                color: "black",
                borderRadius: 8,
                border: "2px solid gold",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={!selected}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 14,
            fontSize: 16,
            background: !selected ? "#d8c46a" : "gold",
            border: "none",
            borderRadius: 8,
            cursor: !selected ? "default" : "pointer",
            opacity: !selected ? 0.8 : 1,
          }}
        >
          {index + 1 === quizQuestions.length ? "Finish" : "Next"}
        </button>

        <h3 style={{ marginTop: 20, opacity: 0.9 }}>
          Question {index + 1} of {quizQuestions.length}
        </h3>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, textAlign: "center", boxSizing: "border-box" }}>
      <h1 style={{ color: "gold" }}>🎉 Quiz Finished!</h1>
      <h2>
        Your Score: {score} / {quizQuestions.length}
      </h2>
      <div style={{ maxWidth: 700, margin: "20px auto", textAlign: "left" }}>
        {answers.map((item, i) => {
          const isCorrect = item.selected === item.correct;
          return (
            <div
              key={`${item.question}-${i}`}
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 10,
                background: isCorrect ? "#e8ffe8" : "#fff1f1",
                border: `1px solid ${isCorrect ? "#7ac77a" : "#e09a9a"}`,
              }}
            >
              <div style={{ fontWeight: "bold", color: "#222" }}>{item.question}</div>
              <div style={{ color: "#333", marginTop: 6 }}>Your answer: {item.selected}</div>
              <div style={{ color: "#333", marginTop: 4 }}>Correct answer: {item.correct}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={startGame} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Play Again
        </button>
        <button onClick={goHome} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Home
        </button>
      </div>
    </div>
  );
}
