import { Clock, Mail, Store } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/shared/contact-form";
import { ContentPage } from "@/components/shared/content-page";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تواصل معنا", description: "تواصل مع فريق سواب للدعم والاستفسارات والشراكات." };

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <ContentPage eyebrow="تواصل معنا" title="حيّاك، كيف نقدر نساعدك؟" intro="قبل التواصل، قد تجد إجابتك في «كيف يعمل سواب» أو «نصائح الأمان». وإذا ما لقيتها، اكتب لنا.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <ContactForm defaults={{ name: user?.displayName ?? "", email: user?.email ?? "" }} />
        </div>
        <aside className="space-y-3 text-sm">
          <div className="flex gap-3 rounded-2xl border border-border bg-surface p-4"><Clock className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">أوقات الدعم</p><p className="text-muted-foreground">الأحد – الخميس، 9 ص – 9 م</p></div></div>
          <div className="flex gap-3 rounded-2xl border border-border bg-surface p-4"><Mail className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">البريد</p><p className="text-muted-foreground" dir="ltr">support@swap.sa</p></div></div>
          <div className="flex gap-3 rounded-2xl border border-border bg-surface p-4"><Store className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">متجر فحص وصيانة؟</p><p className="text-muted-foreground">انضم لشبكة الشركاء المعتمدين واختر «شراكة» في النموذج.</p></div></div>
        </aside>
      </div>
    </ContentPage>
  );
}
