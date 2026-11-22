export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="my-2 h-px bg-white/[0.06]" />;
  return (
    <div className="my-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[9px] uppercase tracking-[0.18em] text-zinc-600">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}
