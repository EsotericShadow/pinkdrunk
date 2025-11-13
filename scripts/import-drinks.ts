import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_CATEGORIES = new Set(["beer", "wine", "cocktail", "shot", "other"]);

(async function main() {
  const [, , inputPath, outputRoot = "src/data/drinks"] = process.argv;
  if (!inputPath) {
    console.error("Usage: pnpm catalog:import <path-to-csv> [output-root]");
    process.exit(1);
  }

  const csv = await readFile(inputPath, "utf-8");
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    console.error("No rows found in", inputPath);
    process.exit(1);
  }

  let imported = 0;
  for (const row of rows) {
    const category = (row.category ?? "").toLowerCase();
    if (!ALLOWED_CATEGORIES.has(category as any)) {
      console.warn(`Skipping row '${row.name}' — invalid category '${row.category}'.`);
      continue;
    }

    const subdir = slug(row.subcategory || row.type || "general");
    const id = slug(row.id || `${row.brand || ""}-${row.name}`);
    if (!row.name || !id) {
      console.warn("Skipping row with missing name/id", row);
      continue;
    }

    const drink = {
      id,
      name: row.name.trim(),
      brand: row.brand?.trim() || undefined,
      category,
      type: row.type?.trim() || undefined,
      style: row.style?.trim() || undefined,
      abvPercent: toNumber(row.abvPercent, 0),
      defaultVolumeMl: toNumber(row.defaultVolumeMl, 150),
      description: row.description?.trim() || undefined,
      base: row.base?.trim() || undefined,
      tags: parseTags(row.tags),
    } satisfies Record<string, any>;

    const targetDir = path.join(outputRoot, category, subdir);
    await mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${drink.id}.json`);
    await writeFile(targetPath, JSON.stringify(drink, null, 2) + "\n", "utf-8");
    imported += 1;
  }

  console.log(`Imported ${imported} drinks into ${outputRoot}`);
})();

type CsvRow = Record<string, string> & {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  style?: string;
  abvPercent?: string;
  defaultVolumeMl?: string;
  description?: string;
  base?: string;
  tags?: string;
};

function parseCsv(csv: string): CsvRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: CsvRow = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = cells[i] ?? "";
    }
    return row;
  });
}

function splitLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((cell) => cell.trim());
}

function slug(value: string | undefined | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTags(raw: string | undefined) {
  if (!raw) return [] as string[];
  return raw
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}
