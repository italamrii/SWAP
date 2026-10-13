import {
  Cable, CircuitBoard, Cpu, Fan, Gamepad2, Gpu, HardDrive, Keyboard, Laptop, MemoryStick, Monitor, PcCase, Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  pc: PcCase,
  laptop: Laptop,
  gpu: Gpu,
  cpu: Cpu,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Zap,
  cooling: Fan,
  monitor: Monitor,
  console: Gamepad2,
  peripheral: Keyboard,
  accessory: Cable,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Cable;
  return <Icon className={className} aria-hidden />;
}
