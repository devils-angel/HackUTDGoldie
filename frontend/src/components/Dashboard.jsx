import { useEffect, useMemo, useState } from "react";
import {
  fetchDashboardOverview,
  fetchDashboardByRegion,
  fetchDashboardByCountry,
  fetchDashboardVerificationStats,
  fetchDashboardFinancialMetrics,
  fetchData
} from "../api";
import Sidebar from "./Sidebar";

const formatCurrency = (value) =>
  value != null ? `$${Number(value).toLocaleString()}` : "—";

const formatPercent = (value, suffix = "%") =>
  value != null ? `${Number(value).toFixed(2)}${suffix}` : "—";

export default function Dashboard() {
  const [marketRows, setMarketRows] = useState([]);
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [verificationStats, setVerificationStats] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [
          marketRes,
          overviewRes,
          regionsRes,
          countriesRes,
          verificationRes,
          financialRes
        ] = await Promise.all([
          fetchData(),
          fetchDashboardOverview(),
          fetchDashboardByRegion(),
          fetchDashboardByCountry(),
          fetchDashboardVerificationStats(),
          fetchDashboardFinancialMetrics()
        ]);
        setMarketRows(marketRes.data || []);
        setOverview(overviewRes.data);
        setRegions(regionsRes.data.regions || []);
        setCountries(countriesRes.data.countries || []);
        setVerificationStats(verificationRes.data);
        setFinancialMetrics(financialRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const marketSummary = useMemo(() => {
    if (!marketRows.length) {
      return { totalSymbols: 0, positiveMoves: 0, averageChange: 0 };
    }
    const totalSymbols = marketRows.length;
    const changes = marketRows.map((row) => Number(row.change) || 0);
    const positiveMoves = changes.filter((value) => value > 0).length;
    const averageChange =
      changes.reduce((acc, curr) => acc + curr, 0) / totalSymbols;
    return {
      totalSymbols,
      positiveMoves,
      averageChange: averageChange.toFixed(2)
    };
  }, [marketRows]);

  return (
    <div className="min-h-screen lg:flex bg-[var(--color-navy)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
            Goldman Intelligence
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold">Loan dashboard</h1>
              <p className="text-[var(--color-text)] mt-2">
                Portfolio KPIs across underwriting, geography, and verification
                stages.
              </p>
            </div>
            <button className="self-start md:self-auto bg-[var(--color-blue)] text-[var(--color-on-blue)] px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition">
              Export report
            </button>
          </div>
        </header>

        {overview && (
          <section className="grid gap-4 md:grid-cols-4">
            {[
              {
                label: "Total Applications",
                value: overview.total_applications
              },
              {
                label: "Approved",
                value: overview.approved
              },
              {
                label: "Rejected",
                value: overview.rejected
              },
              {
                label: "Approval Rate",
                value: `${overview.approval_rate}%`
              }
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-3xl bg-[var(--color-charcoal)] p-6 border border-[var(--color-blue)]/10"
              >
                <p className="text-sm text-[var(--color-sky)]">{card.label}</p>
                <h3 className="text-4xl font-semibold mt-2">{card.value}</h3>
              </article>
            ))}
          </section>
        )}

        {verificationStats && (
          <section className="grid gap-4 md:grid-cols-3">
            {["kyc", "compliance", "eligibility"].map((key) => (
              <article
                key={key}
                className="rounded-3xl bg-[var(--color-charcoal)] p-6 border border-[var(--color-blue)]/10 space-y-3"
              >
                <p className="text-sm text-[var(--color-sky)] uppercase tracking-[0.3em]">
                  {key}
                </p>
                <div className="flex justify-between text-sm text-[var(--color-text)]">
                  <span>Approved</span>
                  <span>{verificationStats[key].approved}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--color-text)]">
                  <span>Rejected</span>
                  <span>{verificationStats[key].rejected}</span>
                </div>
                <p className="text-xl font-semibold">
                  {verificationStats[key].pass_rate}%
                </p>
                {key === "compliance" && (
                  <p className="text-xs text-[var(--color-text)]">
                    Political flags: {verificationStats.compliance.political_connections}
                    <br />
                    Senior ties: {verificationStats.compliance.senior_relatives}
                  </p>
                )}
              </article>
            ))}
          </section>
        )}

        {financialMetrics && (
          <section className="grid gap-4 md:grid-cols-4">
            {[
              {
                label: "Avg Credit Score",
                value: financialMetrics.average_credit_score
              },
              {
                label: "Avg DTI Ratio",
                value: formatPercent(
                  Number(financialMetrics.average_dti_ratio) * 100
                )
              },
              {
                label: "Avg Loan Amount",
                value: formatCurrency(financialMetrics.average_loan_amount)
              },
              {
                label: "Total Loan Volume",
                value: formatCurrency(financialMetrics.total_loan_amount)
              }
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-3xl bg-[var(--color-charcoal)] p-6 border border-[var(--color-blue)]/10"
              >
                <p className="text-sm text-[var(--color-sky)]">{card.label}</p>
                <h3 className="text-4xl font-semibold mt-2">{card.value}</h3>
              </article>
            ))}
          </section>
        )}

        {regions.length > 0 && (
          <section className="bg-[var(--color-charcoal)] rounded-3xl border border-[var(--color-blue)]/10 p-6">
            <h2 className="text-2xl font-semibold mb-4">Regional mix</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-separate border-spacing-y-2">
                <thead className="text-[var(--color-sky)]">
                  <tr>
                    <th className="px-4 py-2">Region</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Approved</th>
                    <th className="px-4 py-2">Rejected</th>
                    <th className="px-4 py-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr
                      key={region.region}
                      className="bg-[var(--color-navy)] rounded-2xl shadow-inner shadow-black/10"
                    >
                      <td className="px-4 py-3">{region.region}</td>
                      <td className="px-4 py-3">{region.total}</td>
                      <td className="px-4 py-3">{region.approved}</td>
                      <td className="px-4 py-3">{region.rejected}</td>
                      <td className="px-4 py-3">{region.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {countries.length > 0 && (
          <section className="bg-[var(--color-charcoal)] rounded-3xl border border-[var(--color-blue)]/10 p-6">
            <h2 className="text-2xl font-semibold mb-4">Country stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-separate border-spacing-y-2">
                <thead className="text-[var(--color-sky)]">
                  <tr>
                    <th className="px-4 py-2">Country</th>
                    <th className="px-4 py-2">Region</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Approved</th>
                    <th className="px-4 py-2">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.slice(0, 10).map((country) => (
                    <tr
                      key={`${country.country}-${country.region}`}
                      className="bg-[var(--color-navy)] rounded-2xl shadow-inner shadow-black/10"
                    >
                      <td className="px-4 py-3">{country.country}</td>
                      <td className="px-4 py-3 text-[var(--color-text)]">
                        {country.region}
                      </td>
                      <td className="px-4 py-3">{country.total}</td>
                      <td className="px-4 py-3">{country.approved}</td>
                      <td className="px-4 py-3">{country.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="bg-[var(--color-charcoal)] rounded-3xl border border-[var(--color-blue)]/10 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Equity tape</h2>
              <p className="text-sm text-[var(--color-text)]">
                Optimized for rapid scanning and responsive layouts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[var(--color-sky)]">
                  {marketRows.length > 0 &&
                    Object.keys(marketRows[0]).map((key) => (
                      <th key={key} className="px-4 py-2 capitalize">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {marketRows.map((row, i) => (
                  <tr
                    key={i}
                    className="bg-[var(--color-navy)] rounded-2xl shadow-inner shadow-black/10"
                  >
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-[var(--color-text)]/90">
                        {val ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {!marketRows.length && (
                  <tr>
                    <td className="px-4 py-6 text-[var(--color-text)]">
                      {loading ? "Loading intelligence feed…" : "No data"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
