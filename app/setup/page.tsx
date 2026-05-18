import Link from "next/link";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <main className="page-shell min-h-screen space-y-5">
      <div className="flex justify-end">
        <Link className="btn" href="/passenger">Uygulamaya dön</Link>
      </div>
      <SetupForm />
    </main>
  );
}
