import type { Metadata } from "next";
import { UavFrequencyTable } from "@/components/UavFrequencyTable";

export const metadata: Metadata = {
  title: "UAV Frequency Table | Airobotics Dubai",
  description:
    "Editable UAV frequency and location reference table for Airobotics Dubai site visits.",
};

export default function UavFrequencyPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-8 pt-16 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-white">UAV Frequency Table</h1>
        <p className="mt-1 text-sm text-muted">
          Reference table for UAV IDs, frequencies, and locations. Tap any cell to
          edit — changes save on this device.
        </p>
      </header>

      <UavFrequencyTable />
    </div>
  );
}
