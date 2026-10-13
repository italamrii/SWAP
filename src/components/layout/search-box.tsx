"use client";

import { Loader2, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Suggestion = { slug: string; title: string; price: number; categoryNameAr: string };
type CatSuggestion = { slug: string; nameAr: string };

const POPULAR = ["RTX 4070", "ماك بوك", "PS5", "7800X3D", "شاشة 240Hz", "DDR5"];

/** Search with live suggestions (listings + categories) and full keyboard support. */
export function SearchBox({ size = "md", defaultValue = "", autoFocus, className }: { size?: "md" | "lg"; defaultValue?: string; autoFocus?: boolean; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [cats, setCats] = useState<CatSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setCats([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          setItems(data.listings ?? []);
          setCats(data.categories ?? []);
          setActive(-1);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = [
    ...cats.map((c) => ({ key: `c-${c.slug}`, href: `/browse/${c.slug}`, label: c.nameAr, meta: "قسم" })),
    ...items.map((i) => ({ key: i.slug, href: `/listing/${i.slug}`, label: i.title, meta: formatSAR(i.price) })),
  ];

  function submit(term = q) {
    setOpen(false);
    const t = term.trim();
    router.push(t ? `/browse?q=${encodeURIComponent(t)}` : "/browse");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) {
        setOpen(false);
        router.push(options[active].href);
      } else submit();
    } else if (e.key === "Escape") setOpen(false);
  }

  const showPanel = open && (q.trim().length < 2 || options.length > 0 || loading);

  return (
    <div ref={wrap} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "flex items-center gap-2 rounded-full border border-input bg-surface shadow-xs transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12",
          size === "lg" ? "h-14 ps-5 pe-1.5" : "h-10 ps-3.5 pe-1",
        )}
      >
        <Search className={cn("shrink-0 text-subtle-foreground", size === "lg" ? "size-5" : "size-4")} aria-hidden />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="ابحث عن كرت شاشة، لابتوب، معالج…"
          aria-label="البحث في سواب"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={cn("h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle-foreground [&::-webkit-search-cancel-button]:hidden", size === "lg" ? "text-base" : "text-sm")}
        />
        {loading && <Loader2 className="size-4 animate-spin text-subtle-foreground" aria-hidden />}
        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-full bg-primary font-semibold text-primary-foreground transition hover:bg-primary-hover",
            size === "lg" ? "h-11 px-6 text-sm" : "h-8 px-3.5 text-[13px]",
          )}
        >
          بحث
        </button>
      </form>

      {showPanel && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-pop">
          {q.trim().length < 2 ? (
            <div className="p-2">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="size-3.5" aria-hidden /> عمليات بحث رائجة
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => submit(p)} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[13px] hover:border-border-strong">
                    <bdi>{p}</bdi>
                  </button>
                ))}
              </div>
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">جارٍ البحث…</div>
          ) : (
            options.map((o, i) => (
              <button
                key={o.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  router.push(o.href);
                }}
                className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start text-sm", i === active && "bg-surface-2")}
              >
                <span className="truncate">{o.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{o.meta}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
