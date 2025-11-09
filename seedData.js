import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse } from "csv-parse/sync";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, "stocks.csv");

const normalizeFloat = (value) =>
  typeof value === "string"
    ? parseFloat(value.replace(/[%+,]/g, ""))
    : Number(value);

const normalizeInt = (value) =>
  typeof value === "string"
    ? parseInt(value.replace(/[,]/g, ""), 10)
    : Number(value);

export const seedStocks = async ({ silent = false } = {}) => {
  const content = fs.readFileSync(csvPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  await query("TRUNCATE TABLE stocks RESTART IDENTITY");

  const insertText = `INSERT INTO stocks
    (symbol, name, last, change, percent_change, price_volume, time)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`;

  await Promise.all(
    records.map((row) =>
      query(insertText, [
        row["Symbol"],
        row["Name"],
        normalizeFloat(row["Last"]),
        normalizeFloat(row["Change"]),
        normalizeFloat(row["%Change"]),
        normalizeInt(row["Price Vol"]),
        row["Time"]
      ])
    )
  );

  if (!silent) {
    console.log(`Seeded ${records.length} stock records`);
  }

  return records.length;
};

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  await seedStocks();
  process.exit(0);
}
