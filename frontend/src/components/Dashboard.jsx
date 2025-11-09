import { useEffect, useState } from "react";
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

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">Dashboard</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-600 text-left text-white">
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((key) => (
                    <th key={key} className="p-3 capitalize">{key}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-300 hover:bg-gray-100">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="p-3">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
