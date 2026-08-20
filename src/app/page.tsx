import { FailureForm } from "@/components/FailureForm";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-sky-800">
          AI Robotics
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Site Visit Checklist
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          Complete this safety checklist once per site visit. Your report is
          emailed to operations.
        </p>
      </header>

      <main className="flex-1">
        <FailureForm />
      </main>
    </div>
  );
}
