"use client";

import { Camera, KeyRound, LogOut, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/listings/form/image-uploader";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { CITIES } from "@/lib/catalog/cities";
import { changePassword, deleteAccount, signOutOtherSessions, updatePrivacy, updateProfile } from "@/server/actions/settings";
import { PasswordInput } from "./password-input";

type Errors = Record<string, string[] | undefined>;

function Card({ title, description, children, danger }: { title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`rounded-2xl border bg-surface p-5 shadow-xs sm:p-6 ${danger ? "border-danger/30" : "border-border"}`}>
      <h2 className={`font-semibold ${danger ? "text-danger" : ""}`}>{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProfileForm({ initial }: { initial: { displayName: string; username: string; city: string; bio: string; avatarUrl: string | null } }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof v, val: string | null) => { setV((p) => ({ ...p, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })); };

  return (
    <Card title="الملف الشخصي" description="يظهر للمشترين في إعلاناتك وصفحتك العامة.">
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={v.displayName} src={v.avatarUrl} size={64} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => file.current?.click()}><Camera />تغيير الصورة</Button>
          {v.avatarUrl && <Button type="button" variant="ghost" size="sm" onClick={() => set("avatarUrl", null)}>إزالة</Button>}
        </div>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setUploading(true);
            try {
              const r = await uploadFile(f, "avatar");
              set("avatarUrl", r.url);
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
      <form
        className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updateProfile({ ...v, city: v.city as never, bio: v.bio || undefined });
            if (r.ok) toast.success(r.message);
            else { setErrors(r.fieldErrors ?? {}); toast.error(r.error); }
          });
        }}
      >
        <Field label="الاسم الظاهر" error={errors.displayName}><Input value={v.displayName} onChange={(e) => set("displayName", e.target.value)} /></Field>
        <Field label="اسم المستخدم" error={errors.username}><Input dir="ltr" className="text-start" value={v.username} onChange={(e) => set("username", e.target.value)} /></Field>
        <Field label="المدينة" error={errors.city}>
          <NativeSelect value={v.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">اختر</option>
            {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </NativeSelect>
        </Field>
        <Field label="نبذة" optional error={errors.bio} className="sm:col-span-2"><Textarea rows={3} maxLength={280} value={v.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
        <div className="sm:col-span-2"><Button type="submit" loading={pending}>حفظ</Button></div>
      </form>
    </Card>
  );
}

export function PrivacyForm({ initial, maskedPhone }: { initial: { showPhone: boolean; notifyEmail: boolean }; maskedPhone: string | null }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Card title="التواصل والخصوصية" description="رقمك مخفي افتراضيًا. التواصل داخل سواب يحفظ خصوصيتك وحقك عند أي بلاغ.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updatePrivacy(v);
            if (r.ok) toast.success(r.message);
            else toast.error(r.error);
          });
        }}
      >
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <span>
            <span className="block text-sm font-medium">إظهار رقمي الموثّق للمشترين المسجّلين</span>
            <span className="block text-[13px] text-muted-foreground">
              {maskedPhone ? <>يظهر زر «إظهار رقم الجوال» في إعلاناتك برقمك <bdi dir="ltr">{maskedPhone}</bdi>.</> : "وثّق رقم جوالك أولًا لتفعيل هذا الخيار."}
            </span>
          </span>
          <Switch checked={v.showPhone} disabled={!maskedPhone} onCheckedChange={(c) => setV({ ...v, showPhone: c })} aria-label="إظهار رقمي الموثّق" />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <span><span className="block text-sm font-medium">تنبيهات البريد الإلكتروني</span><span className="block text-[13px] text-muted-foreground">رسائل جديدة، عروض، ونزول أسعار المفضلة (إذا أضفت بريدًا).</span></span>
          <Switch checked={v.notifyEmail} onCheckedChange={(c) => setV({ ...v, notifyEmail: c })} aria-label="تنبيهات البريد الإلكتروني" />
        </label>
        <Button type="submit" loading={pending}>حفظ</Button>
      </form>
    </Card>
  );
}

export function SecurityForm({ hasPassword }: { hasPassword: boolean }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, start] = useTransition();
  const signOutOthers = (
    <Button type="button" variant="outline" onClick={() => start(async () => { const r = await signOutOtherSessions(); if (r.ok) toast.success(r.message); else toast.error(r.error); })}><LogOut />الخروج من الأجهزة الأخرى</Button>
  );
  if (!hasPassword) {
    return (
      <Card title="الأمان" description="تدخل إلى حسابك برمز يصلك في رسالة SMS — لا توجد كلمة مرور يمكن تسريبها. لا تشارك الرمز مع أي أحد.">
        <div className="flex flex-wrap gap-2">{signOutOthers}</div>
      </Card>
    );
  }
  return (
    <Card title="الأمان" description="غيّر كلمة المرور، أو سجّل الخروج من الأجهزة الأخرى.">
      <form
        className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await changePassword({ current: cur, next });
            if (r.ok) { toast.success(r.message); setCur(""); setNext(""); setErrors({}); }
            else { setErrors(r.fieldErrors ?? {}); toast.error(r.error); }
          });
        }}
      >
        <Field label="كلمة المرور الحالية" error={errors.current}><PasswordInput value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="كلمة المرور الجديدة" error={errors.next} hint="8 أحرف على الأقل، تتضمن حرفًا ورقمًا."><PasswordInput value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" loading={pending} disabled={!cur || !next}><KeyRound />تغيير كلمة المرور</Button>
          {signOutOthers}
        </div>
      </form>
    </Card>
  );
}

export function DangerZone({ email, hasPassword }: { email: string | null; hasPassword: boolean }) {
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const byPassword = hasPassword && !!email;
  const ready = byPassword ? confirm.toLowerCase() === email!.toLowerCase() && !!password : confirm.trim() === "حذف حسابي";
  return (
    <Card title="حذف الحساب" description="يحذف حسابك وإعلاناتك ومحادثاتك نهائيًا. لا يمكن التراجع." danger>
      <Dialog>
        <DialogTrigger asChild><Button variant="destructive-ghost" className="border border-danger/30"><Trash2 />حذف حسابي</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الحساب نهائيًا</DialogTitle>
            <DialogDescription>
              {byPassword
                ? <>للتأكيد، اكتب بريدك <bdi className="font-semibold text-foreground">{email}</bdi> وكلمة المرور.</>
                : <>للتأكيد اكتب «حذف حسابي». لحماية حسابك يجب أن تكون سجّلت الدخول برمز SMS خلال آخر 15 دقيقة.</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {byPassword ? (
              <>
                <Input dir="ltr" className="text-start" placeholder={email!} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="تأكيد البريد" />
                <PasswordInput placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="كلمة المرور" />
              </>
            ) : (
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="حذف حسابي" aria-label="اكتب حذف حسابي للتأكيد" />
            )}
            {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={pending}
              disabled={!ready}
              onClick={() => start(async () => { const r = await deleteAccount(byPassword ? { confirmEmail: confirm, password } : { confirmText: confirm }); if (!r.ok) setError(r.error); })}
            >
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
