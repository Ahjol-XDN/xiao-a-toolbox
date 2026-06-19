interface Props { formats: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label?: string; }

export default function FormatSelector({ formats, value, onChange, label }: Props) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{label}</label>}
      <div className="flex flex-wrap gap-1.5">
        {formats.map((fmt) => (
          <button key={fmt.value} onClick={() => onChange(fmt.value)} className="px-3.5 py-1.5 text-sm rounded-lg border transition-all duration-150"
            style={{
              background: value === fmt.value ? "var(--accent-dark)" : "var(--bg-secondary)",
              color: value === fmt.value ? "#fff" : "var(--text-secondary)",
              borderColor: value === fmt.value ? "var(--accent-dark)" : "var(--border-subtle)",
              boxShadow: value === fmt.value ? "0 1px 3px rgba(0,120,212,0.3)" : "none",
              fontWeight: value === fmt.value ? 500 : 400,
            }}>
            {fmt.label}
          </button>
        ))}
      </div>
    </div>
  );
}