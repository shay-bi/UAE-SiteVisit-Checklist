import Image from "next/image";
import { SiteVisitApp } from "@/components/SiteVisitApp";

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
      >
        <Image
          src="/brand/airobotics-equipment.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/85 to-background" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6">
        <header className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/airobotics-logo.png"
            alt="Airobotics"
            width={220}
            height={220}
            priority
            className="h-auto w-44 sm:w-52"
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
