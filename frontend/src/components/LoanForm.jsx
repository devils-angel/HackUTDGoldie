import { useState } from "react";
import { applyForLoan } from "../api";

export default function LoanForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    income: "",
    debt: "",
    credit_score: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await applyForLoan(formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error applying for loan:", error);
      alert("Error: " + (error.response?.data?.error || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto border rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">Loan Eligibility Check</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {["name", "email", "income", "debt", "credit_score"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1 capitalize">
              {field.replace("_", " ")}
            </label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Checking..." : "Submit"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold">Result:</h3>
          <p>
            <strong>Debt-to-Income Ratio:</strong> {result.dti}
          </p>
          <p>
            <strong>Recommendation:</strong>{" "}
            <span
              className={
                result.recommendation === "Eligible"
                  ? "text-green-600 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              {result.recommendation}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
