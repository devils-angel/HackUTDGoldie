import { useEffect, useMemo, useState } from "react";
import { fetchData } from "../api";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchData();
        setRows(response.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    getData();
  }, []);

  const summary = useMemo(() => {
    if (!rows.length) {
      return {
        totalSymbols: 0,
        positiveMoves: 0,
        averageChange: 0,
      };
    }
    const totalSymbols = rows.length;
    const changes = rows.map((row) => Number(row.change) || 0);
    const positiveMoves = changes.filter((value) => value > 0).length;
    const averageChange =
      changes.reduce((acc, curr) => acc + curr, 0) / totalSymbols;

    return {
      totalSymbols,
      positiveMoves,
      averageChange: averageChange.toFixed(2),
    };
  }, [rows]);

  return (
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
            Goldman Intelligence
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold">Market surveillance</h1>
              <p className="text-[#C3CDDA] mt-2">
                Live snapshot of equities powering the underwriting desk.
              </p>
            </div>
            <button className="self-start md:self-auto bg-[#2178C4] text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition">
              Export report
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-[#1B1F35] p-6 border border-white/5">
            <p className="text-sm text-[#A5B8D0]">Tracked Symbols</p>
            <h3 className="text-4xl font-semibold mt-2">
              {summary.totalSymbols}
            </h3>
            <p className="text-sm text-[#C3CDDA] mt-2">
              Instruments monitored in real time.
            </p>
          </article>
          <article className="rounded-3xl bg-[#1B1F35] p-6 border border-white/5">
            <p className="text-sm text-[#A5B8D0]">Positive Momentum</p>
            <h3 className="text-4xl font-semibold mt-2">
              {summary.positiveMoves}
            </h3>
            <p className="text-sm text-[#C3CDDA] mt-2">
              Signals supporting approvals.
            </p>
          </article>
          <article className="rounded-3xl bg-[#1B1F35] p-6 border border-white/5">
            <p className="text-sm text-[#A5B8D0]">Avg. % Change</p>
            <h3 className="text-4xl font-semibold mt-2">
              {summary.averageChange}%
            </h3>
            <p className="text-sm text-[#C3CDDA] mt-2">
              Weighted delta across watchlist.
            </p>
          </article>
        </section>

        <section className="bg-[#1B1F35] rounded-3xl border border-white/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Equity tape</h2>
              <p className="text-sm text-[#C3CDDA]">
                Optimized for rapid scanning and responsive layouts.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-full text-sm bg-white/10 text-white">
                All
              </button>
              <button className="px-4 py-2 rounded-full text-sm text-[#C3CDDA] border border-white/10">
                Movers
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[#A5B8D0]">
                  {rows.length > 0 &&
                    Object.keys(rows[0]).map((key) => (
                      <th key={key} className="px-4 py-2 capitalize">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className="bg-[#22263F] rounded-2xl shadow-inner shadow-black/10"
                  >
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-white/90">
                        {val ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td className="px-4 py-6 text-[#C3CDDA]">
                      Loading intelligence feed…
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
