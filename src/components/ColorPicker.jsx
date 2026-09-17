import { Pipette, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalizeHex(value) {
  const raw = String(value || "").trim().replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase()}`;
  }
  return null;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex) || "#000000";
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export default function ColorPicker({
  value = "#8B5CF6",
  onChange,
  onClose,
  title = "COLOR PICKER",
}) {
  const normalizedValue = normalizeHex(value) || "#8B5CF6";
  const initialHsv = useMemo(() => {
    const rgb = hexToRgb(normalizedValue);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [normalizedValue]);

  const [hue, setHue] = useState(initialHsv.h);
  const [saturation, setSaturation] = useState(initialHsv.s);
  const [brightness, setBrightness] = useState(initialHsv.v);
  const [hexInput, setHexInput] = useState(normalizedValue);
  const [dragging, setDragging] = useState(false);

  const saturationRef = useRef(null);
  const fallbackColorRef = useRef(null);

  useEffect(() => {
    const rgb = hexToRgb(normalizedValue);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
    setHexInput(normalizedValue);
  }, [normalizedValue]);

  const commitHsv = (nextHue, nextSaturation, nextBrightness) => {
    const nextHex = hsvToHex(nextHue, nextSaturation, nextBrightness);
    setHue(nextHue);
    setSaturation(nextSaturation);
    setBrightness(nextBrightness);
    setHexInput(nextHex);
    onChange?.(nextHex);
  };

  const updateFromPointer = (clientX, clientY) => {
    const bounds = saturationRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((clientY - bounds.top) / bounds.height, 0, 1);

    commitHsv(hue, x, 1 - y);
  };

  const handlePointerDown = (event) => {
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp = (event) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleHueChange = (event) => {
    const nextHue = Number(event.target.value);
    commitHsv(nextHue, saturation, brightness);
  };

  const commitHexInput = () => {
    const normalized = normalizeHex(hexInput);
    if (!normalized) {
      setHexInput(normalizedValue);
      return;
    }

    const rgb = hexToRgb(normalized);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
    setHexInput(normalized);
    onChange?.(normalized);
  };

  const handleEyedropper = async () => {
    if ("EyeDropper" in window) {
      try {
        const result = await new window.EyeDropper().open();
        const normalized = normalizeHex(result?.sRGBHex);
        if (!normalized) return;

        const rgb = hexToRgb(normalized);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
        setHexInput(normalized);
        onChange?.(normalized);
        return;
      } catch {
        return;
      }
    }

    fallbackColorRef.current?.click();
  };

  const hueColor = hsvToHex(hue, 1, 1);
  const handleLeft = `${saturation * 100}%`;
  const handleTop = `${(1 - brightness) * 100}%`;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="컬러 피커 닫기"
            style={styles.closeButton}
          >
            <X size={18} strokeWidth={1.9} />
          </button>
        ) : null}
      </div>

      <div
        ref={saturationRef}
        role="slider"
        tabIndex={0}
        aria-label="채도와 밝기 선택"
        style={{
          ...styles.saturationArea,
          backgroundColor: hueColor,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragging(false)}
      >
        <div style={styles.whiteGradient} />
        <div style={styles.blackGradient} />

        <span
          style={{
            ...styles.saturationHandle,
            left: handleLeft,
            top: handleTop,
          }}
        />
      </div>

      <div style={styles.controls}>
        <div style={styles.hexField}>
          <span style={styles.hexLabel}>HEX</span>
          <input
            value={hexInput.replace("#", "")}
            onChange={(event) => setHexInput(`#${event.target.value}`)}
            onBlur={commitHexInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            maxLength={6}
            spellCheck={false}
            style={styles.hexInput}
          />
        </div>

        <div style={styles.hueGroup}>
          <div style={styles.hueSliderWrap}>
            <input
              type="range"
              min="0"
              max="359"
              value={Math.round(hue)}
              onChange={handleHueChange}
              aria-label="색상 선택"
              style={styles.hueSlider}
            />
            <span
              style={{
                ...styles.hueThumbVisual,
                left: `calc(${(hue / 359) * 100}% - 7px)`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleEyedropper}
            aria-label="화면에서 색상 추출"
            title="스포이드"
            style={styles.eyedropperButton}
          >
            <Pipette size={18} strokeWidth={1.8} />
          </button>

          <input
            ref={fallbackColorRef}
            type="color"
            value={normalizedValue}
            onChange={(event) => {
              const normalized = normalizeHex(event.target.value);
              if (!normalized) return;
              const rgb = hexToRgb(normalized);
              const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
              setHue(hsv.h);
              setSaturation(hsv.s);
              setBrightness(hsv.v);
              setHexInput(normalized);
              onChange?.(normalized);
            }}
            tabIndex={-1}
            aria-hidden="true"
            style={styles.hiddenColorInput}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    width: "100%",
    padding: "18px 18px 20px",
    border: "1px solid #D9D9D9",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
  },

  header: {
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  title: {
    color: "#22232A",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },

  closeButton: {
    width: 28,
    height: 28,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#6B6B72",
    cursor: "pointer",
  },

  saturationArea: {
    position: "relative",
    width: "100%",
    height: 176,
    overflow: "hidden",
    borderRadius: 12,
    cursor: "crosshair",
    touchAction: "none",
  },

  whiteGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
    pointerEvents: "none",
  },

  blackGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(0deg, #000000 0%, rgba(0,0,0,0) 100%)",
    pointerEvents: "none",
  },

  saturationHandle: {
    position: "absolute",
    width: 17,
    height: 17,
    border: "3px solid #FFFFFF",
    borderRadius: "50%",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },

  controls: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "minmax(150px, 0.95fr) minmax(0, 1fr)",
    gap: 12,
    alignItems: "center",
  },

  hexField: {
    height: 44,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #D9D9D9",
    borderRadius: 8,
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
  },

  hexLabel: {
    flexShrink: 0,
    color: "#77777F",
    fontSize: 12,
    fontWeight: 500,
  },

  hexInput: {
    width: "100%",
    minWidth: 0,
    padding: 0,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "#2F3850",
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "0.01em",
    fontFamily: "inherit",
  },

  hueGroup: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 40px",
    gap: 8,
    alignItems: "center",
  },

  hueSliderWrap: {
    position: "relative",
    height: 44,
    display: "flex",
    alignItems: "center",
  },

  hueSlider: {
    width: "100%",
    height: 14,
    margin: 0,
    padding: 0,
    border: "none",
    borderRadius: 999,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    background:
      "linear-gradient(90deg, #FF0000 0%, #FFFF00 16.66%, #00FF00 33.33%, #00FFFF 50%, #0000FF 66.66%, #FF00FF 83.33%, #FF0000 100%)",
    cursor: "pointer",
  },

  hueThumbVisual: {
    position: "absolute",
    top: "50%",
    width: 18,
    height: 18,
    border: "3px solid #FFFFFF",
    borderRadius: "50%",
    boxSizing: "border-box",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.14)",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },

  eyedropperButton: {
    width: 40,
    height: 40,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #D9D9D9",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#4A4A52",
    cursor: "pointer",
  },

  hiddenColorInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
  },
};
