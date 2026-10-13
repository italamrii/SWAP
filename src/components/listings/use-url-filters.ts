"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** URL-as-state for browse filters. Every change resets pagination. */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | null | undefined>, opts: { keepPage?: boolean } = {}) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === undefined || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      if (!opts.keepPage) sp.delete("page");
      sp.delete("focus");
      const qs = sp.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );

  const toggleInList = useCallback(
    (key: string, value: string) => {
      const current = (params.get(key) ?? "").split(",").filter(Boolean);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      update({ [key]: next.join(",") || null });
    },
    [params, update],
  );

  const clearAll = useCallback(() => {
    const q = params.get("q");
    const sort = params.get("sort");
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sort) sp.set("sort", sort);
    start(() => router.replace(sp.toString() ? `${pathname}?${sp}` : pathname, { scroll: false }));
  }, [params, pathname, router]);

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);

  return { params, update, toggleInList, clearAll, list, pending };
}
