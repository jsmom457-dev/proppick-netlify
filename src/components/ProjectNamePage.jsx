import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import TopBar from "./TopBar";
import Stepper from "./Stepper";
import Button from "./Button";

export default function ProjectNamePage({ value, onChange, onPrev, onNext,
  onLogoClick,
}) {
  const [focused, setFocused] = useState(false);
  const canNext = value.trim().length > 0;

  return (
    <div style={styles.page}>
      <TopBar onLogoClick={onLogoClick} />
      <Stepper currentStep={1} />

      <main style={styles.card}>
        <h1 style={styles.title}>프로젝트명을 입력해주세요</h1>
        <p style={styles.desc}>무대 디자인 프로젝트의 이름을 지어주세요. 나중에 변경할 수 있어요.</p>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>프로젝트명</label>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, 50))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="프로젝트명, 컨셉, 공간 으로 검색..."
            style={{
              ...styles.input,
              ...(focused ? styles.inputFocus : {}),
            }}
          />
          <p style={styles.count}>{value.length} / 50 자</p>
        </div>
      </main>

      <div style={styles.nav}>
        <Button variant="secondary" onClick={onPrev} icon={<ArrowLeft size={20} />}>
          취소
        </Button>
        <Button onClick={onNext} disabled={!canNext} icon={<ArrowRight size={20} />}>
          다음
        </Button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    color: "#1A1A22",
    fontFamily: "Pretendard, sans-serif",
  },
  card: {
    width: 964,
    height: 289,
    margin: "0 auto",
    padding: "36px 40px",
    borderRadius: 12,
    border: "1px solid #E8E8E8",
    boxSizing: "border-box",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: "29px",
  },
  desc: {
    margin: "8px 0 0",
    fontSize: 16,
    lineHeight: "19px",
  },
  fieldGroup: {
    marginTop: 50,
  },
  label: {
    display: "block",
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 500,
  },
  input: {
    width: 884,
    height: 43,
    padding: "12px 10px",
    borderRadius: 8,
    border: "1px solid #E8E8E8",
    backgroundColor: "#F5F6F8",
    fontSize: 16,
    color: "#1A1A22",
    boxSizing: "border-box",
    outline: "none",
  },
  inputFocus: {
    backgroundColor: "#FFFFFF",
    borderColor: "#5B6CFF",
  },
  count: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#666666",
  },
  nav: {
    width: 964,
    margin: "26px auto 0",
    display: "flex",
    justifyContent: "space-between",
  },
};