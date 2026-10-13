"use client";

import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./listing-actions";

export function ReportUserButton({ userId, signedIn, username }: { userId: string; signedIn: boolean; username: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => (signedIn ? setOpen(true) : router.push(`/sign-in?next=/seller/${username}`))}>
        <Flag className="size-4" />إبلاغ
      </Button>
      <ReportDialog targetType="user" targetId={userId} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
