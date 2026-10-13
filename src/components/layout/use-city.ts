"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { CITY_VALUES } from "@/lib/catalog/cities";

const KEY = "swap.city";
const listeners = new Set<() => void>();

function read(): string {
  try {
    const v = localStorage.getItem(KEY) ?? "";
    return (CITY_VALUES as readonly string[]).includes(v) ? v : "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Preferred city: the URL (?city=) wins on browse pages, otherwise the value
 * remembered on this device. Choosing a city on a browse page applies it immediately.
 */
export function useCity() {
  const stored = useSyncExternalStore(subscribe, read, () => "");
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const onBrowse = pathname.startsWith("/browse");
  const fromUrl = onBrowse ? params.get("city") ?? "" : null;
  const city = fromUrl ?? stored;

  const setCity = useCallback(
    (value: string) => {
      try {
        if (value) localStorage.setItem(KEY, value);
        else localStorage.removeItem(KEY);
      } catch {
        /* storage unavailable */
      }
      listeners.forEach((l) => l());
      if (onBrowse) {
        const sp = new URLSearchParams(params.toString());
        if (value) sp.set("city", value);
        else sp.delete("city");
        sp.delete("page");
        router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false });
      }
    },
    [onBrowse, params, pathname, router],
  );

  return { city, setCity };
}
