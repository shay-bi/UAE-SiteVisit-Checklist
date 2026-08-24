import type { Metadata } from "next";
import Link from "next/link";
import { PdfViewer } from "@/components/PdfViewer";

export const metadata: Metadata = {
  title: "Work with the Flights Pricelist | Airobotics Dubai",
  description:
    "Work with the Flights Pricelist document for Airobotics Dubai site visits.",
};

export default function FlightsPricelistPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-8 pt-16 sm:px-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Work with the Flights Pricelist
          </h1>
          <p className="mt-1 text-sm text-muted">
            Use this when working with the flights pricelist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/docs/flights-pricelist.pdf"
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

      <PdfViewer
        src="/docs/flights-pricelist.pdf"
        title="Flights Pricelist PDF"
      />
    </div>
  );
}
