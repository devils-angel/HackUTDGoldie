import { useState } from "react";
import axios from "axios";

export default function LoanForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    region: "AMERICAS",
    country: "",
    income: "",
    debt: "",
    credit_score: "",
    loan_amount: "",
    loan_purpose: "Home Purchase",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const REGIONS = ["APAC", "EMEA", "AMERICAS", "MEA", "NA", "SA", "EU", "ASIA"];
  
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
    "Emergency Funds",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // API endpoint - keep in sync with backend port
      const API_BASE_URL = "http://localhost:5002";
      
      const response = await axios.post(
        `${API_BASE_URL}/loan-application/submit`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          region: formData.region,
          country: formData.country,
          income: parseFloat(formData.income),
          debt: parseFloat(formData.debt),
          credit_score: parseInt(formData.credit_score),
          loan_amount: parseFloat(formData.loan_amount),
          loan_purpose: formData.loan_purpose,
          documents_uploaded: true,
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error("Error applying for loan:", err);
      setError(
        err.response?.data?.error || 
        err.message || 
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Loan Application
            </h2>
            <p className="text-gray-600">
              Complete the form below to check your loan eligibility
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john.doe@example.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1234567890"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    placeholder="United States"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income ($) *
                  </label>
                  <input
                    type="number"
                    name="income"
                    value={formData.income}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="75000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Debt ($) *
                  </label>
                  <input
                    type="number"
                    name="debt"
                    value={formData.debt}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="25000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Score *
                  </label>
                  <input
                    type="number"
                    name="credit_score"
                    value={formData.credit_score}
                    onChange={handleChange}
                    required
                    min="300"
                    max="850"
                    placeholder="720"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount ($) *
                  </label>
                  <input
                    type="number"
                    name="loan_amount"
                    value={formData.loan_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="250000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Loan Details Section */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Loan Details
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Purpose *
                </label>
                <select
                  name="loan_purpose"
                  value={formData.loan_purpose}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LOAN_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Application...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && result.application && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-md">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-green-800 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Application Submitted Successfully!
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">Application ID:</p>
                    <p className="text-gray-900 font-mono">
                      {result.application.application_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Status:</p>
                    <p
                      className={`font-bold ${
                        result.application.final_status === "APPROVED"
                          ? "text-green-600"
                          : result.application.final_status === "REJECTED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {result.application.final_status}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-200">
                  <p className="font-semibold text-gray-700 mb-2">
                    Verification Results:
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          result.application.kyc_status === "APPROVED"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      <span>
                        KYC Verification: {result.application.kyc_status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          result.application.compliance_status === "APPROVED"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      <span>
                        Compliance Check:{" "}
                        {result.application.compliance_status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          result.application.eligibility_status === "APPROVED"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      <span>
                        Eligibility Assessment:{" "}
                        {result.application.eligibility_status}
                      </span>
                    </div>
                  </div>
                </div>

                {result.application.dti_ratio && (
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-gray-600">
                      <strong>Debt-to-Income Ratio:</strong>{" "}
                      {(result.application.dti_ratio * 100).toFixed(1)}%
                    </p>
                  </div>
                )}

                {result.application.final_remarks && (
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-gray-600 italic">
                      {result.application.final_remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
