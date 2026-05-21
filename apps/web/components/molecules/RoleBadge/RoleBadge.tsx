import { Avatar } from "@/components/atoms/Avatar";

interface RoleBadgeProps {
  role: string;
  name: string;
  sub?: string;
  initials: string;
}

export function RoleBadge({ role, name, sub, initials }: RoleBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 h-8 pl-[11px] pr-1 bg-surface-1 border border-hairline rounded-full cursor-pointer flex-shrink-0">
      <span className="text-[9.5px] font-bold tracking-[0.14em] text-accent uppercase">{role}</span>
      <span className="text-[11.5px] text-foreground font-medium">
        {name}
        {sub && <small className="text-foreground-muted font-normal"> · {sub}</small>}
      </span>
      <Avatar initials={initials} />
    </div>
  );
}
