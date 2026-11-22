import { ECHO_PALETTE } from '@/lib/utils/color';

export function ColorPicker({ value, onChange, includePalette = true }: { value: string; onChange: (color: string) => void; includePalette?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="color"
        aria-label="Custom color"
        value={value.startsWith('#') && value.length === 7 ? value : '#4fd8e8'}
        onChange={(event) => onChange(event.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-white/10 bg-transparent p-0"
      />
      {includePalette && ECHO_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Use color ${color}`}
          title={color}
          onClick={() => onChange(color)}
          className={`h-4 w-4 rounded-full border transition-transform hover:scale-125 ${value === color ? 'border-white ring-1 ring-white/40' : 'border-white/10'}`}
          style={{ background: color }}
        />
      ))}
    </div>
  );
}
