import React, { useState, useRef } from "react";

const TIME_OPTIONS = [
  { label: "자(子) 23:30 ~ 01:29", value: "자(子)" },
  { label: "축(丑) 01:30 ~ 03:29", value: "축(丑)" },
  { label: "인(寅) 03:30 ~ 05:29", value: "인(寅)" },
  { label: "묘(卯) 05:30 ~ 07:29", value: "묘(卯)" },
  { label: "진(辰) 07:30 ~ 09:29", value: "진(辰)" },
  { label: "사(巳) 09:30 ~ 11:29", value: "사(巳)" },
  { label: "오(午) 11:30 ~ 13:29", value: "오(午)" },
  { label: "미(未) 13:30 ~ 15:29", value: "미(未)" },
  { label: "신(申) 15:30 ~ 17:29", value: "신(申)" },
  { label: "유(酉) 17:30 ~ 19:29", value: "유(酉)" },
  { label: "술(戌) 19:30 ~ 21:29", value: "술(戌)" },
  { label: "해(亥) 21:30 ~ 23:29", value: "해(亥)" }
];

function App() {
  const [birth, setBirth] = useState("");
  const [time, setTime] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setAnswer("");
    try {
      const data = {
        action: {
          detailParams: {
            "생년월일": { value: birth },
            "태어난 시각": { value: time }
          }
        }
      };
      const response = await fetch("https://pmk9440.pythonanywhere.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setAnswer(result.template.outputs[0].simpleText.text || "오류");
    } catch (err) {
      setAnswer("로또 번호 요청 중 오류 발생!");
    }
    setLoading(false);

    // 1분(60초) 타이머 시작
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: "2rem",
          padding: "2.5rem 2rem",
          minWidth: 320,
          boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}
      >
        <h1 style={{ color: "#222", fontSize: "2rem", marginBottom: 24 }}>로또 번호 생성기</h1>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, color: "#222", fontWeight: 600 }}>
            생년월일
          </label>
          <input
            type="date"
            value={birth}
            onChange={e => setBirth(e.target.value)}
            required
            style={{
              width: "90%",
              padding: 8,
              fontSize: "1rem",
              border: "1.5px solid #d1d5db",
              borderRadius: "8px"
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, color: "#222", fontWeight: 600 }}>
            태어난 시각
          </label>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            required
            style={{
              width: "90%",
              padding: 8,
              fontSize: "1rem",
              border: "1.5px solid #d1d5db",
              borderRadius: "8px",
              background: "#f3f4f6"
            }}
          >
            <option value="">선택하세요</option>
            {TIME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          style={{
            background: cooldown > 0 ? "#d1d5db" : "#6366f1",
            color: "#fff",
            border: "none",
            padding: "0.7rem 1.5rem",
            borderRadius: "1rem",
            fontSize: "1.1rem",
            cursor: cooldown > 0 || loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(99,102,241,0.08)",
            letterSpacing: "1px",
            transition: "background 0.2s"
          }}
          disabled={loading || cooldown > 0}
        >
          {loading
            ? "생성 중..."
            : cooldown > 0
            ? `${cooldown}초 뒤 재생성`
            : "로또 번호 생성하기"}
        </button>
        {cooldown > 0 && (
          <div style={{ marginTop: 8, color: "#6366f1", fontWeight: 500 }}>
            {`남은 시간: ${cooldown}초`}
          </div>
        )}
        <div
          style={{
            whiteSpace: "pre-line",
            marginTop: 20,
            fontSize: "1.1rem",
            color: "#222"
          }}
        >
          {answer}
        </div>
      </form>
    </div>
  );
}

export default App;
