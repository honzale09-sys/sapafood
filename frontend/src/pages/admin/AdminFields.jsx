import { ALLERGENS } from "../../lib/i18n";

export const AllergenPicker = ({ value = [], onChange, testPrefix }) => {
  const toggle = (n) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n].sort((a, b) => a - b));
  return (
    <div className="grid grid-cols-7 gap-1.5" data-testid={`${testPrefix}-allergen-picker`}>
      {ALLERGENS.vi.map((label, i) => {
        const n = i + 1;
        const on = value.includes(n);
        return (
          <button
            key={n}
            type="button"
            title={label}
            aria-pressed={on}
            onClick={() => toggle(n)}
            data-testid={`${testPrefix}-allergen-${n}`}
            className={`h-11 rounded-xl border font-mono text-sm transition-colors ${on ? "border-lacquer bg-lacquer text-paper" : "border-tamarind/20 bg-white text-tamarind hover:border-tamarind/50"}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
};

export const Field = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium">{label}</span>
    {children}
    {hint && <span className="block text-xs text-tamarind/50">{hint}</span>}
  </label>
);

export const inputCls = "h-12 w-full rounded-xl border border-tamarind/20 bg-white px-3 text-base outline-none focus:border-lacquer";
export const areaCls = "min-h-[72px] w-full rounded-xl border border-tamarind/20 bg-white px-3 py-2 text-base outline-none focus:border-lacquer";

export const parsePrice = (v) => {
  const s = String(v ?? "").trim();
  if (!/^\d+$/.test(s) || Number(s) <= 0) return null;
  return Number(s);
};
