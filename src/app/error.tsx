"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger"><TriangleAlert className="size-7" /></span>
      <div>
        <h1 className="text-xl font-bold">صار خطأ غير متوقع</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">نعتذر عن ذلك. جرّب مرة ثانية، وإذا تكررت المشكلة تواصل معنا.{error.digest && <span className="mt-1 block text-xs" dir="ltr">ref: {error.digest}</span>}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}><RotateCcw />حاول مرة أخرى</Button>
        <Button asChild variant="outline"><Link href="/">الرئيسية</Link></Button>
      </div>
    </main>
  );
}
