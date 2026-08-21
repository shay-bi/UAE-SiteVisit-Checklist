import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flight Report | Airobotics Dubai",
  description: "Flight Report document for Airobotics Dubai site visits.",
};

export default function FlightReportPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-8 pt-16 sm:px-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Flight Report</h1>
          <p className="mt-1 text-sm text-muted">
            Read this before any flight.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/docs/flight-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-white"
          >
            Open PDF
          </a>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white"
          >
            Back to checklist
          </Link>
        </div>
      </header>

      <div className="min-h-[70vh] flex-1 overflow-hidden rounded-xl border border-border bg-surface">
        <iframe
          title="Flight Report PDF"
          src="/docs/flight-report.pdf#view=FitH"
          className="h-[75vh] w-full border-0 bg-white sm:h-[80vh]"
        />
      </div>
    </div>
  );
}
