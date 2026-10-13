import { Compass } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="relative">
        <p className="text-[120px] leading-none font-bold tracking-tighter text-surface-2 select-none num" aria-hidden>404</p>
        <Compass className="absolute inset-0 m-auto size-12 text-primary" aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-muted-foreground">يمكن الرابط قديم، أو الإعلان انحذف. خلّنا نرجعك للطريق.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild><Link href="/">الرئيسية</Link></Button>
        <Button asChild variant="outline"><Link href="/browse">تصفّح الإعلانات</Link></Button>
      </div>
    </main>
  );
}
