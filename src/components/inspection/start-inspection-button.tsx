"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function StartInspectionButton({ listingId, label = "ابدأ التوثيق", variant = "primary" }: { listingId: string; label?: string; variant?: "primary" | "outline" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant={variant} loading={pending} onClick={() => start(() => router.push(`/account/verification/${listingId}`))}>
      <ShieldCheck />{label}
    </Button>
  );
}
