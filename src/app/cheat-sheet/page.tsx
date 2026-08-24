import type { Metadata } from "next";
import { CheatSheet } from "@/components/CheatSheet";
import { parseCheatSheet } from "@/lib/cheat-sheet";
import { CHEAT_SHEET_SOURCE } from "@/lib/cheat-sheet-source";

export const metadata: Metadata = {
  title: "Cheat Sheet | Airobotics Dubai",
  description:
    "Airobotics Dubai cheat sheet and procedures for site work.",
};

export default function CheatSheetPage() {
  const sections = parseCheatSheet(CHEAT_SHEET_SOURCE);
  return <CheatSheet sections={sections} />;
}
