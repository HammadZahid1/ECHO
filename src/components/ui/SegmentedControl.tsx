interface Option<T extends string> {
  value: T;
  label: string;
  title?: string;
}

export function SegmentedControl<T extends string>({
  options, value, onChange, className = '', label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={`inline-flex rounded-[5px] border border-white/[0.08] bg-black/25 p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          title={option.title ?? option.label}
          onClick={() => onChange(option.value)}
          className={`rounded-[3px] px-2 py-1 text-[10px] transition-colors ${value === option.value ? 'bg-white/[0.09] text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
