import Image from "next/image";
import { AdminPanel } from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6">
        <header className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/airobotics-dubai-logo.png"
            alt="Airobotics Dubai"
            width={400}
            height={133}
            priority
            className="h-auto w-full max-w-xs"
          />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Admin panel
          </h1>
          <p className="mt-2 text-sm text-muted">
            View all site-visit checklist reports
          </p>
          <div className="mt-4 h-1 w-12 rounded-sm bg-brand-orange" />
        </header>

        <main className="flex-1">
          <AdminPanel />
        </main>
      </div>
    </div>
  );
}
