export function NavBrand() {
  return (
    <div className="flex items-center gap-2.5 w-[232px] pr-4 border-r border-hairline mr-[18px] h-full flex-shrink-0">
      <div className="relative w-7 h-7 rounded-lg bg-accent grid place-items-center text-bg font-extrabold text-[14px] tracking-[-0.04em] font-mono overflow-hidden flex-shrink-0">
        S
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)] pointer-events-none" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[14px] font-bold tracking-[-0.02em]">
          simón<span className="text-accent">.</span>
        </span>
        <span className="mt-[3px] text-[9.5px] font-medium tracking-[0.16em] text-foreground-dim uppercase">
          Fleet Ops · v3.2
        </span>
      </div>
    </div>
  );
}
