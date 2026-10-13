"use client";

import { Bell, Heart, LayoutDashboard, LogOut, MessageSquare, Package, Settings, ShieldCheck, Tag, User } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/server/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function UserMenu({
  user,
  counts,
}: {
  user: { displayName: string; username: string; avatarUrl: string | null; email: string; isStaff: boolean };
  counts: { messages: number; notifications: number; offers: number };
}) {
  const badge = counts.messages + counts.offers;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-full outline-offset-2" aria-label="قائمة الحساب">
        <Avatar name={user.displayName} src={user.avatarUrl} size={36} />
        {badge > 0 && <span className="absolute -top-0.5 -end-0.5 size-3 rounded-full border-2 border-background bg-rose-500" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2.5">
          <Avatar name={user.displayName} src={user.avatarUrl} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{user.displayName}</span>
            <span className="block truncate text-xs" dir="ltr">@{user.username}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/account"><LayoutDashboard />لوحة حسابي</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/listings"><Package />إعلاناتي</Link></DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/messages"><MessageSquare />الرسائل{counts.messages > 0 && <Count n={counts.messages} />}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/offers"><Tag />العروض والبدل{counts.offers > 0 && <Count n={counts.offers} />}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/favorites"><Heart />المفضلة</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/notifications"><Bell />التنبيهات{counts.notifications > 0 && <Count n={counts.notifications} />}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/seller/${user.username}`}><User />ملفي العام</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/settings"><Settings />الإعدادات</Link></DropdownMenuItem>
        {user.isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/admin"><ShieldCheck />لوحة الإدارة</Link></DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={() => void signOut()}><LogOut />تسجيل الخروج</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ms-auto rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{n > 99 ? "99+" : n}</span>;
}
