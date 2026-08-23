import type { Metadata } from "next";
import { UavFrequencyTable } from "@/components/UavFrequencyTable";

export const metadata: Metadata = {
  title: "UAVs Lora IDs | Airobotics Dubai",
  description:
    "Shared UAVs and Lora ID reference table. Propose changes for admin approval.",
};

export default function UavFrequencyPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-10 pt-16 sm:max-w-2xl sm:px-6">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          UAVs Lora IDs
        </h1>
      </header>

      <UavFrequencyTable />
    </div>
  );
}
