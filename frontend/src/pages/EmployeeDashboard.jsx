import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Layout from "../components/Layout";

function EmployeeDashboard() {

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [error, setError] = useState("");

  const fetchLeaves = async () => {
    try {
      const [leavesRes, typesRes] = await Promise.all([
        API.get("/leaves/mine"),
        API.get("/leave-types"),
      ]);
      const leaves = leavesRes.data;

      const pending = leaves.filter(l => l.status === "pending").length;
      const approved = leaves.filter(l => l.status === "approved").length;
      const rejected = leaves.filter(l => l.status === "rejected").length;

      setStats({
        total: leaves.length,
        pending,
        approved,
        rejected
      });

      setLeaveBalances(typesRes.data.map((type) => {
        const usedDays = leaves
          .filter((leave) => {
            const leaveTypeId = leave.leaveType?._id || leave.leaveType;
            return leave.status === "approved" && leaveTypeId === type._id;
          })
          .reduce((total, leave) => {
            const start = new Date(`${leave.fromDate.slice(0, 10)}T00:00:00Z`);
            const end = new Date(`${leave.toDate.slice(0, 10)}T00:00:00Z`);
            return total + Math.floor((end - start) / 86400000) + 1;
          }, 0);

        return {
          id: type._id,
          name: type.name,
          maximum: Number(type.maxDays),
          used: usedDays,
          remaining: Math.max(0, Number(type.maxDays) - usedDays),
        };
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your leave information");
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <Layout>
      <div>

        <h2 className="text-3xl font-semibold text-gray-700">
          Employee Dashboard
        </h2>

        <p className="text-gray-500 mt-1">
          Overview of your leave activity
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm">Total Leave Requests</h3>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-yellow-600 text-sm">Pending Approval</h3>
            <p className="text-3xl font-bold mt-2">{stats.pending}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-green-600 text-sm">Approved Leaves</h3>
            <p className="text-3xl font-bold mt-2">{stats.approved}</p>
          </div>

          <div className="bg-red-50 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-red-600 text-sm">Rejected Requests</h3>
            <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
          </div>

        </div>

        <section className="mt-10" aria-labelledby="leave-balances-heading">
          <div className="mb-4">
            <h3 id="leave-balances-heading" className="text-xl font-semibold text-slate-700">
              Leave balances
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Approved requests count as inclusive calendar days.
            </p>
          </div>

          {leaveBalances.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {leaveBalances.map((balance) => (
                <div key={balance.id} className="bg-white p-5 rounded-xl shadow">
                  <h4 className="font-semibold text-slate-700">{balance.name}</h4>
                  <p className="mt-3 text-2xl font-bold text-slate-800">
                    {balance.remaining}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      / {balance.maximum} days left
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {balance.used} approved {balance.used === 1 ? "day" : "days"} used
                  </p>
                </div>
              ))}
            </div>
          ) : (
            !error && <p className="text-sm text-slate-500">No leave types are configured yet.</p>
          )}
        </section>

      </div>
    </Layout>



  );
}

export default EmployeeDashboard;