import Image from "next/image";
import { SiteVisitApp } from "@/components/SiteVisitApp";

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6">
        <header className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/airobotics-dubai-logo.png?v=2"
            alt="Airobotics Dubai"
            width={480}
            height={160}
            priority
            unoptimized
            className="h-auto w-full max-w-sm bg-transparent"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Site Visit Checklist
          </h1>
          <p className="mt-2 max-w-sm text-base leading-relaxed text-muted">
            Complete this safety checklist once per site visit.
          </p>
          <div className="mt-4 h-1 w-12 rounded-sm bg-brand-orange" />
        </header>

        <main className="flex-1">
          <SiteVisitApp />
        </main>
      </div>
    </div>
  );
}
