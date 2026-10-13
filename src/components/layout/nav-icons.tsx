import {
  ArrowLeftRight, BadgeCheck, Bell, Building2, CircleHelp, CircleUser, Clock, FileText, FolderTree, Heart, House, Info, LayoutGrid,
  LifeBuoy, Lock, Mail, MessageSquare, Package, Plus, Settings, ShieldCheck, Tag, type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "@/lib/nav";

const MAP: Record<NavIcon, LucideIcon> = {
  home: House, grid: LayoutGrid, clock: Clock, swap: ArrowLeftRight, verified: BadgeCheck, folders: FolderTree, user: CircleUser,
  package: Package, plus: Plus, chat: MessageSquare, tag: Tag, heart: Heart, bell: Bell, settings: Settings, shield: ShieldCheck,
  info: Info, lifebuoy: LifeBuoy, help: CircleHelp, mail: Mail, building: Building2, file: FileText, lock: Lock,
};

export function NavIconGlyph({ icon, className }: { icon: NavIcon; className?: string }) {
  const Icon = MAP[icon];
  return <Icon className={className} aria-hidden />;
}
