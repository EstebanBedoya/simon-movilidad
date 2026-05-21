interface AvatarProps {
  initials: string;
}

export function Avatar({ initials }: AvatarProps) {
  return (
    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f4f4f] to-[#2a2a2a] text-foreground grid place-items-center text-[10px] font-bold font-mono border border-hairline-strong flex-shrink-0">
      {initials}
    </span>
  );
}
