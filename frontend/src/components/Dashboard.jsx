import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [verificationStats, setVerificationStats] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        overviewRes,
        regionsRes,
        countriesRes,
        verificationRes,
        financialRes,
        timelineRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/overview`),
        fetch(`${API_BASE_URL}/dashboard/by-region`),
        fetch(`${API_BASE_URL}/dashboard/by-country`),
        fetch(`${API_BASE_URL}/dashboard/verification-stats`),
        fetch(`${API_BASE_URL}/dashboard/financial-metrics`),
        fetch(`${API_BASE_URL}/dashboard/timeline?days=7`)
      ]);

      const overviewData = await overviewRes.json();
      const regionsData = await regionsRes.json();
      const countriesData = await countriesRes.json();
      const verificationData = await verificationRes.json();
      const financialData = await financialRes.json();
      const timelineData = await timelineRes.json();

      setOverview(overviewData);
      setRegions(regionsData.regions || []);
      setCountries(countriesData.countries || []);
      setVerificationStats(verificationData);
      setFinancialMetrics(financialData);
      setTimeline(timelineData.timeline || []);
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-red-800 text-xl font-bold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Loan Application Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time analytics and insights for loan applications
          </p>
        </div>

        {/* Overview KPI Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Applications</h3>
                <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-3xl font-bold">{overview.total_applications}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Approved</h3>
                <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-3xl font-bold">{overview.approved}</p>
              <p className="text-sm opacity-90 mt-1">
                {overview.approval_rate}% approval rate
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Rejected</h3>
                <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-3xl font-bold">{overview.rejected}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Pending</h3>
                <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-3xl font-bold">{overview.pending}</p>
            </div>
          </div>
        )}

        {/* Verification Funnel */}
        {verificationStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Funnel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KYC */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">KYC Verification</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved:</span>
                    <span className="font-bold text-green-600">{verificationStats.kyc.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected:</span>
                    <span className="font-bold text-red-600">{verificationStats.kyc.rejected}</span>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${verificationStats.kyc.pass_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {verificationStats.kyc.pass_rate}% pass rate
                  </p>
                </div>
              </div>

              {/* Compliance */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Compliance Check</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved:</span>
                    <span className="font-bold text-green-600">{verificationStats.compliance.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected:</span>
                    <span className="font-bold text-red-600">{verificationStats.compliance.rejected}</span>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${verificationStats.compliance.pass_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {verificationStats.compliance.pass_rate}% pass rate
                  </p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">Political: {verificationStats.compliance.political_connections}</p>
                    <p className="text-xs text-gray-500">Senior Relatives: {verificationStats.compliance.senior_relatives}</p>
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Eligibility Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved:</span>
                    <span className="font-bold text-green-600">{verificationStats.eligibility.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected:</span>
                    <span className="font-bold text-red-600">{verificationStats.eligibility.rejected}</span>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${verificationStats.eligibility.pass_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {verificationStats.eligibility.pass_rate}% pass rate
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Metrics */}
        {financialMetrics && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Metrics (Approved Applications)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Credit Score</p>
                <p className="text-3xl font-bold text-blue-600">{financialMetrics.average_credit_score}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg DTI Ratio</p>
                <p className="text-3xl font-bold text-green-600">
                  {(financialMetrics.average_dti_ratio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Loan Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(financialMetrics.average_loan_amount / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Loans</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${(financialMetrics.total_loan_amount / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Income</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${(financialMetrics.average_income / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regional Distribution */}
        {regions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regions.map((region) => (
                <div key={region.region} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">{region.region}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold">{region.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">Approved:</span>
                      <span className="font-semibold text-green-600">{region.approved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Rejected:</span>
                      <span className="font-semibold text-red-600">{region.rejected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Pending:</span>
                      <span className="font-semibold text-yellow-600">{region.pending}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          style={{ width: `${(region.approved / region.total * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        {((region.approved / region.total) * 100).toFixed(1)}% approved
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Country Statistics */}
        {countries.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Country-wise Statistics</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Country</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Region</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Approved</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Rejected</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Approval Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{country.country}</td>
                      <td className="py-3 px-4 text-gray-600">{country.region}</td>
                      <td className="py-3 px-4 text-center">{country.total}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{country.approved}</td>
                      <td className="py-3 px-4 text-center text-red-600 font-semibold">{country.rejected}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {((country.approved / country.total) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity (Last 7 Days)</h2>
            <div className="space-y-3">
              {timeline.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{day.date}</p>
                    <p className="text-sm text-gray-600">Total: {day.total} applications</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{day.approved}</p>
                      <p className="text-xs text-gray-500">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{day.rejected}</p>
                      <p className="text-xs text-gray-500">Rejected</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}