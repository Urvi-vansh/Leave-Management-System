import React, { useState, useEffect } from "react";
import API from "../api/axios";

function LeaveRequestForm() {

  const [types, setTypes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [error, setError] = useState("");
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [typesRes, leavesRes] = await Promise.all([
          API.get("/leave-types"),
          API.get("/leaves/mine"),
        ]);
        setTypes(typesRes.data);
        setLeaves(leavesRes.data);
      } catch (err) {
        setLoadError(err.response?.data?.message || "Could not load leave balance information");
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  const selectedType = types.find((type) => type._id === form.leaveType);
  const approvedDays = selectedType
    ? leaves
        .filter((leave) => {
          const leaveTypeId = leave.leaveType?._id || leave.leaveType;
          return leave.status === "approved" && leaveTypeId === selectedType._id;
        })
        .reduce((total, leave) => {
          const start = new Date(`${leave.fromDate.slice(0, 10)}T00:00:00Z`);
          const end = new Date(`${leave.toDate.slice(0, 10)}T00:00:00Z`);
          return total + Math.floor((end - start) / 86400000) + 1;
        }, 0)
    : 0;
  const remainingDays = selectedType
    ? Math.max(0, Number(selectedType.maxDays) - approvedDays)
    : 0;
  const requestedDays = form.fromDate && form.toDate
    ? Math.floor(
        (new Date(`${form.toDate}T00:00:00Z`) -
          new Date(`${form.fromDate}T00:00:00Z`)) /
          86400000,
      ) + 1
    : 0;

  const updateDate = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    if (updatedForm.fromDate && updatedForm.fromDate < todayString) {
      setError("Start date cannot be before today");
    } else if (
      updatedForm.fromDate &&
      updatedForm.toDate &&
      updatedForm.toDate < updatedForm.fromDate
    ) {
      setError("End date cannot be before the start date");
    } else {
      setError("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (error || (selectedType && requestedDays > remainingDays)) return;

    try {

      await API.post("/leaves", form);

      alert("Leave application submitted successfully!");
      setError("");

      setForm({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: ""
      });

    } catch (err) {
      setError(err.response?.data?.message || "Could not submit leave request");
    }
  };

  return (

    <form
      onSubmit={submit}
      className="bg-white border border-slate-300 shadow-sm rounded-lg p-6 space-y-5 mt-4"
    >

      <h3 className="text-lg font-medium text-slate-700">
        Apply for Leave
      </h3>

      {/* Leave Type */}
      <div>

        <label className="block text-sm font-medium text-slate-600 mb-1">
          Leave Type
        </label>

        <select
          className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={form.leaveType}
          onChange={(e) => {
            setError("");
            setForm({ ...form, leaveType: e.target.value });
          }}
          required
        >
          <option value="">Select Leave Type</option>

          {types.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}

        </select>

        {selectedType && (
          <p className="mt-2 text-sm text-slate-500" aria-live="polite">
            Remaining balance: <strong>{remainingDays}</strong> of {selectedType.maxDays} calendar days
            {requestedDays > 0 && ` · This request: ${requestedDays} calendar ${requestedDays === 1 ? "day" : "days"}`}
          </p>
        )}

      </div>


      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">

        <div>

          <label className="block text-sm font-medium text-slate-600 mb-1">
            Start Date
          </label>

          <input
            type="date"
            min={todayString}
            className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.fromDate}
            onChange={(e) => updateDate("fromDate", e.target.value)}
            required
          />

        </div>

        <div>

          <label className="block text-sm font-medium text-slate-600 mb-1">
            End Date
          </label>

          <input
            type="date"
            min={form.fromDate || todayString}
            className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.toDate}
            onChange={(e) => updateDate("toDate", e.target.value)}
            required
          />

        </div>

      </div>


      {/* Reason */}
      <div>

        <label className="block text-sm font-medium text-slate-600 mb-1">
          Reason for Leave
        </label>

        <textarea
          rows="4"
          placeholder="Explain the reason for your leave..."
          className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={form.reason}
          onChange={(e) => {
            setError("");
            setForm({ ...form, reason: e.target.value });
          }}
          required
        />

      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      {loadError && (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {loadError}
        </div>
      )}
      {selectedType && requestedDays > remainingDays && (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          This request exceeds the remaining {remainingDays} calendar {remainingDays === 1 ? "day" : "days"} for {selectedType.name}.
        </div>
      )}
      {/* Submit */}
      <button
        type="submit"
        disabled={loading || Boolean(loadError) || Boolean(error) || (Boolean(selectedType) && requestedDays > remainingDays)}
        className="bg-slate-800 text-white px-5 py-2 rounded-md hover:bg-slate-900 transition"
      >
        {loading ? "Loading leave balance..." : "Submit Leave Application"}
      </button>

    </form>

  );
}

export default LeaveRequestForm;