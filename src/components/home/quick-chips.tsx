"use client";

import { ArrowLeftRight, BadgeCheck, MapPin, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useCity } from "@/components/layout/use-city";
import { cityLabel } from "@/lib/catalog/cities";

/** Quick discovery filters. The city chip follows the visitor's chosen city. */
export function QuickChips() {
  const { city } = useCity();
  const chips = [
    { href: "/browse?verified=1", label: "موثّق بتقرير فحص", icon: BadgeCheck, cls: "text-primary-ink" },
    { href: "/browse?swap=1", label: "يقبل البدل", icon: ArrowLeftRight, cls: "text-swap-ink" },
    { href: "/browse?max=500", label: "أقل من 500 ر.س", icon: Wallet },
    { href: "/browse?min=500&max=2000", label: "500 – 2,000 ر.س", icon: Wallet },
    { href: "/browse?condition=new,like_new", label: "جديد وكالجديد", icon: Sparkles },
    ...(city ? [{ href: `/browse?city=${city}`, label: `في ${cityLabel(city)}`, icon: MapPin, cls: "text-primary-ink" }] : []),
  ];
  return (
    <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" aria-label="فلاتر سريعة">
      {chips.map((c) => (
        <li key={c.href} className="shrink-0">
          <Link href={c.href} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[12.5px] font-medium text-foreground transition hover:border-border-strong">
            <c.icon className={`size-3.5 ${c.cls ?? "text-muted-foreground"}`} aria-hidden />
            {c.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
