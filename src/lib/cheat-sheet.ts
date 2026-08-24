export type CheatSheetPart =
  | "cheat-sheet"
  | "common"
  | "detailed"
  | "monthly";

export type CheatSheetSection = {
  id: string;
  part: CheatSheetPart;
  title: string;
  body: string;
};

export const CHEAT_SHEET_PARTS: { id: CheatSheetPart; label: string }[] = [
  { id: "cheat-sheet", label: "Cheat sheet" },
  { id: "common", label: "Common procedures" },
  { id: "detailed", label: "Detailed procedures" },
  { id: "monthly", label: "Monthly inspection" },
];

const DASH_LINE = /^\s*-{10,}\s*$/;

/** Category headers in the cheat sheet, e.g. "DRONE-" or "linux commands-". */
function isCategoryHeader(line: string): boolean {
  const t = line.trim();
  if (!t.endsWith("-") || t.length > 40 || t.includes(":")) return false;
  return t.length >= 3;
}

function slug(value: string, used: Set<string>): string {
  const base =
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function firstLineTitle(block: string): { title: string; body: string } {
  const trimmed = block.replace(/^\s+/, "").replace(/\s+$/, "");
  const nl = trimmed.indexOf("\n");
  if (nl === -1) return { title: trimmed, body: "" };
  return {
    title: trimmed.slice(0, nl).trim(),
    body: trimmed.slice(nl + 1).replace(/^\s+/, "").replace(/\s+$/, ""),
  };
}

function splitProcedureBlocks(text: string): string[] {
  const byDashes = text.split(/\n(?=\s*-{10,}\s*$)/m);
  const chunks: string[] = [];
  for (const part of byDashes) {
    const cleaned = part
      .split("\n")
      .filter((line) => !DASH_LINE.test(line))
      .join("\n")
      .trim();
    if (!cleaned) continue;
    for (const sub of cleaned.split(/\n{3,}/)) {
      const t = sub.trim();
      if (t) chunks.push(t);
    }
  }
  return chunks;
}

export function parseCheatSheet(source: string): CheatSheetSection[] {
  const text = source.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const used = new Set<string>();
  const sections: CheatSheetSection[] = [];

  const idx = (pred: (line: string) => boolean) =>
    lines.findIndex((line) => pred(line.trim()));

  const cheatIdx = idx((l) => l === "CHEAT SHEET");
  const commonIdx = idx((l) => l === "COMMON PROCEDURES");
  const detailedIdx = idx((l) => l.startsWith("DETAILED PROCEDURES"));
  const monthlyIdx = idx((l) => l === "MONTHLY INSPECTION INSTRUCTIONS");

  if (cheatIdx >= 0 && commonIdx > cheatIdx) {
    const cheatLines = lines.slice(cheatIdx + 1, commonIdx);
    let currentTitle = "";
    let currentBody: string[] = [];

    const flush = () => {
      if (!currentTitle) return;
      sections.push({
        id: slug(currentTitle, used),
        part: "cheat-sheet",
        title: currentTitle,
        body: currentBody.join("\n").replace(/\s+$/, ""),
      });
    };

    for (const line of cheatLines) {
      if (isCategoryHeader(line)) {
        flush();
        currentTitle = line.trim();
        currentBody = [];
      } else if (currentTitle) {
        currentBody.push(line);
      }
    }
    flush();
  }

  if (commonIdx >= 0) {
    const end = detailedIdx >= 0 ? detailedIdx : monthlyIdx >= 0 ? monthlyIdx : lines.length;
    const block = lines.slice(commonIdx + 1, end).join("\n");
    for (const chunk of splitProcedureBlocks(block)) {
      const { title, body } = firstLineTitle(chunk);
      if (!title) continue;
      sections.push({
        id: slug(title, used),
        part: "common",
        title,
        body,
      });
    }
  }

  if (detailedIdx >= 0) {
    const end = monthlyIdx >= 0 ? monthlyIdx : lines.length;
    const block = lines.slice(detailedIdx + 1, end).join("\n");
    for (const chunk of splitProcedureBlocks(block)) {
      const { title, body } = firstLineTitle(chunk);
      if (!title) continue;
      sections.push({
        id: slug(title, used),
        part: "detailed",
        title,
        body,
      });
    }
  }

  if (monthlyIdx >= 0) {
    const body = lines
      .slice(monthlyIdx + 1)
      .join("\n")
      .replace(/^\s+/, "")
      .replace(/\s+$/, "");
    sections.push({
      id: slug("MONTHLY INSPECTION INSTRUCTIONS", used),
      part: "monthly",
      title: "MONTHLY INSPECTION INSTRUCTIONS",
      body,
    });
  }

  return sections;
}

export function sectionMatches(
  section: CheatSheetSection,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    section.title.toLowerCase().includes(q) ||
    section.body.toLowerCase().includes(q)
  );
}
