import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse } from "csv-parse/sync";
import db from "./db.js";

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

export const seedStocks = ({ silent = false } = {}) => {
  const content = fs.readFileSync(csvPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  db.prepare("DELETE FROM stocks").run();

  const insertStmt = db.prepare(
    `INSERT INTO stocks (symbol, name, last, change, percent_change, price_volume, time)
     VALUES (@symbol, @name, @last, @change, @percent_change, @price_volume, @time)`
  );

  const insertMany = db.transaction((rows) => {
    rows.forEach((row) => {
      insertStmt.run({
        symbol: row["Symbol"],
        name: row["Name"],
        last: normalizeFloat(row["Last"]),
        change: normalizeFloat(row["Change"]),
        percent_change: normalizeFloat(row["%Change"]),
        price_volume: normalizeInt(row["Price Vol"]),
        time: row["Time"]
      });
    });
  });

  insertMany(records);

  if (!silent) {
    console.log(`Seeded ${records.length} stock records`);
  }

  return records.length;
};

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  seedStocks();
}
