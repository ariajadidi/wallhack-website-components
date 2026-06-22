"use client";

type Option = { value: string; label: string; disabled?: boolean };

export function PillRow({
  label,
  options,
  active,
  onPick,
}: {
  label: string;
  options: Option[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 10, color: "#7a7a7e", width: 50 }}>{label}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((o) => {
          const isActive = o.value === active;
          return (
            <button
              key={o.value}
              onClick={() => !o.disabled && onPick(o.value)}
              disabled={o.disabled}
              aria-pressed={isActive}
              style={{
                padding: "6px 14px",
                fontSize: 11,
                border: "none",
                borderRadius: 2,
                background: isActive ? "#141416" : "#e2e2e4",
                color: isActive
                  ? "#ededee"
                  : o.disabled
                    ? "#bcbcbf"
                    : "#141416",
                fontWeight: 500,
                letterSpacing: "0.02em",
                cursor: o.disabled ? "not-allowed" : "pointer",
                transition: "background 180ms ease, color 180ms ease",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
