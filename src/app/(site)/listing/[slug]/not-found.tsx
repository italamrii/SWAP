import { PackageX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState icon={PackageX} title="الإعلان غير متاح" description="ربما بِيعت القطعة أو حذف صاحبها الإعلان. تصفّح إعلانات مشابهة." action={<Button asChild><Link href="/browse">تصفّح الإعلانات</Link></Button>} />
    </div>
  );
}
