import React, { useState, useRef, useEffect } from "react";

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

const COLORS = [
  "#f8c445", // 노랑
  "#64b5f6", // 파랑
  "#ff6f91", // 분홍
  "#b2dfdb", // 민트
  "#f48fb1", // 핑크
  "#90caf9", // 연파랑
];

function parseLottoText(resultText) {
  // "1번: [4, 6, 13, 14, 34, 37]\n2번: ..." → [[4,6,13,14,34,37], ...]
  return resultText
    .split("\n")
    .filter((line) => line.includes("["))
    .map((line) => {
      const match = line.match(/\[(.+?)\]/);
      if (!match) return [];
      return match[1]
        .split(",")
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => !isNaN(n));
    });
}

// Lotto 디자인 컴포넌트
function LottoTicket({ resultText }) {
  if (!resultText) return null;
  const lottoLines = parseLottoText(resultText);

  return (
    <div style={{ marginTop: 12 }}>
      {lottoLines.map((nums, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            border: "2px dashed #6366f1",
            borderRadius: 16,
            boxShadow: "0 2px 8px #eee",
            padding: "10px 20px",
            margin: "8px 0",
            maxWidth: 350,
            marginLeft: "auto",
            marginRight: "auto",
            position: "relative",
          }}
        >
          <span
            style={{
              minWidth: 26,
              color: "#bdbdbd",
              fontWeight: "bold",
              marginRight: 6,
              fontSize: 14,
            }}
          >
            {String.fromCharCode(65 + i)}
          </span>
          {nums.map((num, idx) => (
            <span
              key={num}
              style={{
                width: 32,
                height: 32,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: COLORS[idx % COLORS.length],
                color: "#fff",
                fontWeight: "bold",
                fontSize: 18,
                margin: "0 5px",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              }}
            >
              {num}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [birth, setBirth] = useState("");
  const [time, setTime] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [compareResult, setCompareResult] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const timerRef = useRef();
  const [latestRound, setLatestRound] = useState(0);

  // 최신 회차 fetch
  useEffect(() => {
    fetch("https://pmk9440.pythonanywhere.com/latest_round")
      .then(res => res.json())
      .then(data => setLatestRound(data.round))
      .catch(() => setLatestRound(0));
  }, []);

  // 회차 계산
  function getRoundTitle() {
    if (!latestRound) return "최신";
    // 현재 시간
    const now = new Date();
    // 한국 시간 맞추기
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const koreaTime = new Date(utc + 9 * 60 * 60 * 1000);
    const day = koreaTime.getDay(); // 0:일~6:토
    const hour = koreaTime.getHours();
    const minute = koreaTime.getMinutes();

    // 매주 토요일 20시(8pm) 전이면 최신회차, 이후면 +1회차
    let round = latestRound;

    return `${round+1}회차 로또 번호 생성`;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setAnswer("");
    setCompareResult(null);  // 결과 초기화
    setShowCompare(false);
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

  // 과거 당첨 이력 비교하기 버튼 클릭 핸들러
  const handleCompare = async () => {
    if (!answer) return;
    const lottoLines = parseLottoText(answer); // 기존 함수 재활용
    try {
      const res = await fetch("https://pmk9440.pythonanywhere.com/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lottoLines }),
      });
      const result = await res.json();
      setCompareResult(result.compare);
      setShowCompare(true);
    } catch (e) {
      alert("비교 중 오류 발생!");
    }
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
          <div
            style={{
              color: "#6366f1",
              fontWeight: 900,
              fontSize: "2.2rem",
              letterSpacing: "-1px",
              fontFamily: "'Pretendard','Noto Sans KR',sans-serif"
            }}
          >
            {getRoundTitle().split("회차")[0]}회차
          </div>
          <div
            style={{
              color: "#222",
              fontWeight: 800,
              fontSize: "2rem",
              marginTop: 6,
              marginBottom: 40,
              fontFamily: "'Pretendard','Noto Sans KR',sans-serif"
            }}
          >
            로또 번호 생성
          </div>
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
        <LottoTicket resultText={answer} />

        {/* 비교 버튼 & 팝업 */}
        {answer && (
          <button
            style={{
              marginTop: 20, background: "#6366f1", color: "#fff",
              padding: "10px 24px", borderRadius: "10px", border: "none", fontWeight: 700,
              fontSize: "1.05rem", cursor: "pointer", boxShadow:"0 2px 6px #d5dfff"
            }}
            onClick={handleCompare}
            type="button"
          >
            과거 당첨 이력 비교하기
          </button>
        )}
        {showCompare && compareResult && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.28)", display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 8px 32px #aaa", minWidth: 320
            }}>
              <h2 style={{marginBottom:16}}>과거 당첨 이력 비교</h2>
              {compareResult.map((row, i) => (
                <div key={i} style={{margin: "8px 0"}}>
                  <b>{String.fromCharCode(65 + i)}</b>: {row.same}개 일치
                  {row.회차 && (
                    <span style={{marginLeft:8, color:"#6366f1"}}> (회차: {row.회차}, 당첨번호: [{row.번호.join(", ")}])</span>
                  )}
                </div>
              ))}
              <button onClick={() => setShowCompare(false)}
                style={{marginTop:16, background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", fontWeight:600, cursor:"pointer"}}
              >닫기</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default App;
