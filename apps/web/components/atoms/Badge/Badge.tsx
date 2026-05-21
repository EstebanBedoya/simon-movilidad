interface BadgeProps {
  count: number;
}

export function Badge({ count }: BadgeProps) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-[3px] -right-[3px] min-w-[14px] h-[14px] px-1 bg-danger text-white text-[9px] font-bold rounded-full grid place-items-center border-2 border-bg font-mono">
      {count}
    </span>
  );
}
