import process from "process";
import { pathToFileURL } from "url";
import VerificationService from "./verificationService.js";
import { createLoanApplication } from "./loanService.js";
import db from "./db.js";

const REGIONS = ["APAC", "EMEA", "AMERICAS", "MEA"];

const COUNTRIES_BY_REGION = {
  APAC: ["India", "China", "Japan", "Singapore", "Australia", "South Korea", "Indonesia", "Thailand"],
  EMEA: ["United Kingdom", "Germany", "France", "UAE", "South Africa", "Spain", "Italy", "Netherlands"],
  AMERICAS: ["United States", "Canada", "Brazil", "Mexico", "Argentina", "Chile", "Colombia"],
  MEA: ["UAE", "Saudi Arabia", "Egypt", "Kenya", "Nigeria", "Qatar"]
};

const FIRST_NAMES = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "David",
  "Emma",
  "Robert",
  "Lisa",
  "William",
  "Maria",
  "James",
  "Jennifer",
  "Richard",
  "Linda",
  "Thomas",
  "Patricia",
  "Raj",
  "Priya",
  "Mohammed",
  "Fatima",
  "Wei",
  "Ming",
  "Carlos",
  "Sofia"
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Patel",
  "Kumar",
  "Singh",
  "Chen",
  "Wang",
  "Li",
  "Ahmed",
  "Hassan",
  "Fernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Taylor"
];

const LOAN_PURPOSES = [
  "Home Purchase",
  "Business Expansion",
  "Education",
  "Medical Expenses",
  "Debt Consolidation",
  "Vehicle Purchase",
  "Home Renovation",
  "Working Capital",
  "Investment",
  "Emergency Funds"
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomPhone = () =>
  `+${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000000000 + 1000000000)}`;

const randomEmail = (name) => {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com", "email.com"];
  return `${name.toLowerCase().replace(/\s+/g, ".")}@${randomItem(domains)}`;
};

export const seedLoanApplications = (count = 50, { silent = false } = {}) => {
  const log = silent ? () => {} : console.log;

  log("============================================================");
  log(`Generating ${count} sample loan applications`);
  log("============================================================");

  for (let i = 0; i < count; i += 1) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const region = randomItem(REGIONS);
    const country = randomItem(COUNTRIES_BY_REGION[region]);

    const incomeBracket = randomItem([
      [30000, 60000],
      [60000, 100000],
      [100000, 200000],
      [200000, 500000]
    ]);
    const income =
      Math.round(
        (Math.random() * (incomeBracket[1] - incomeBracket[0]) + incomeBracket[0]) / 1000
      ) * 1000;
    const debtRatio = Math.random() * 0.5 + 0.1;
    const debt = Math.round(income * debtRatio);
    const creditBands = [
      [550, 649],
      [650, 699],
      [700, 749],
      [750, 850]
    ];
    const band = randomItem(creditBands);
    const creditScore = Math.floor(Math.random() * (band[1] - band[0]) + band[0]);
    const loanMultiplier = Math.random() * 3 + 2;
    const loanAmount = Math.round((income * loanMultiplier) / 1000) * 1000;

    const createdOffsetDays = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - createdOffsetDays * 24 * 60 * 60 * 1000).toISOString();

    const application = createLoanApplication({
      name: fullName,
      email: randomEmail(fullName),
      phone: randomPhone(),
      region,
      country,
      income,
      debt,
      credit_score: creditScore,
      loan_amount: loanAmount,
      loan_purpose: randomItem(LOAN_PURPOSES),
      documents_uploaded: true,
      created_at: createdAt
    });

    VerificationService.processApplication(application.application_id);
    log(
      `[${i + 1}/${count}] ${application.application_id} -> ${application.region}/${application.country}`
    );
  }

  const summary = db
    .prepare(
      `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN final_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN final_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
       FROM loan_applications`
    )
    .get();

  if (!silent) {
    log("\nSummary:");
    log(`  Total Applications: ${summary.total}`);
    log(`  Approved: ${summary.approved}`);
    log(`  Rejected: ${summary.rejected}`);

    REGIONS.forEach((region) => {
      const { count: regionCount = 0 } =
        db
          .prepare("SELECT COUNT(*) as count FROM loan_applications WHERE region = ?")
          .get(region) || {};
      log(`  ${region}: ${regionCount}`);
    });

    log("============================================================");
    log("Loan application seeding complete");
  }

  return summary;
};

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  const argCount = Number(process.argv[2]);
  const count = Number.isFinite(argCount) && argCount > 0 ? argCount : 50;
  seedLoanApplications(count);
}
