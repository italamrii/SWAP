"use client";

import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ListingImage } from "./listing-image";

type Img = { id: string; url: string; alt: string | null };

export function ImageGallery({ images, title, icon, overlay }: { images: Img[]; title: string; icon: string; overlay?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const count = images.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + count) % count;
      setIndex(next);
      const el = track.current?.children[next] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    [count],
  );

  // Keep index in sync when the user swipes the scroll-snap track (mobile).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setIndex(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    Array.from(el.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [count]);

  if (count === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
        <ListingImage src={null} alt={title} icon={icon} />
        {overlay}
      </div>
    );
  }

  return (
    <div>
      <div
        className="group relative overflow-hidden rounded-2xl border border-border bg-surface-2"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index + 1);
          if (e.key === "ArrowRight") go(index - 1);
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="معرض صور"
        aria-label={`صور ${title}`}
      >
        <div ref={track} className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none">
          {images.map((img, i) => (
            <button key={img.id} data-i={i} type="button" onClick={() => setZoom(true)} className="relative aspect-[4/3] w-full shrink-0 snap-center cursor-zoom-in" aria-label={`عرض الصورة ${i + 1} بحجم كامل`}>
              <ListingImage src={img.url} alt={img.alt ?? title} icon={icon} priority={i === 0} sizes="(min-width: 1024px) 60vw, 100vw" />
            </button>
          ))}
        </div>
        {overlay}
        {count > 1 && (
          <>
            <NavButton side="prev" onClick={() => go(index - 1)} />
            <NavButton side="next" onClick={() => go(index + 1)} />
            <span className="absolute bottom-3 start-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white num" dir="ltr" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
        <button type="button" onClick={() => setZoom(true)} className="absolute bottom-3 end-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-graphite shadow-xs opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label="تكبير">
          <Expand className="size-4" />
        </button>
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`الصورة ${i + 1}`}
              aria-current={i === index}
              className={cn("relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border-2 transition sm:w-24", i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <ListingImage src={img.url} alt="" icon={icon} sizes="96px" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-5xl bg-black p-0 sm:max-w-5xl sm:p-0" hideClose={false}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative aspect-[4/3] w-full">
            <ListingImage src={images[index]?.url} alt={images[index]?.alt ?? title} icon={icon} fit="contain" sizes="100vw" />
            {count > 1 && (
              <>
                <NavButton side="prev" onClick={() => go(index - 1)} always />
                <NavButton side="next" onClick={() => go(index + 1)} always />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({ side, onClick, always }: { side: "prev" | "next"; onClick: () => void; always?: boolean }) {
  // RTL: "previous" sits on the right.
  const Icon = side === "prev" ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "prev" ? "الصورة السابقة" : "الصورة التالية"}
      className={cn(
        "absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-graphite shadow-card transition hover:bg-white sm:flex",
        side === "prev" ? "start-3" : "end-3",
        !always && "opacity-0 group-hover:opacity-100 focus:opacity-100",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
