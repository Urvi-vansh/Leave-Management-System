const LeaveRequest = require("../models/LeaveRequest");
const LeaveType = require("../models/LeaveType");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getInclusiveLeaveDays, parseDateOnly } = require("../utils/leaveDates");

const getApprovedDays = async (employeeId, leaveTypeId) => {
  const approvedLeaves = await LeaveRequest.find({
    employee: employeeId,
    leaveType: leaveTypeId,
    status: "approved",
  }).select("fromDate toDate");

  return approvedLeaves.reduce((total, leave) => {
    const days = getInclusiveLeaveDays(
      leave.fromDate.toISOString().slice(0, 10),
      leave.toDate.toISOString().slice(0, 10),
    );

    if (!days) {
      throw new Error(`Approved leave request ${leave._id} has invalid dates`);
    }

    return total + days;
  }, 0);
};

// Employee apply leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    const type = await LeaveType.findById(leaveType);
    if (!type) {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    const start = parseDateOnly(fromDate);
    const end = parseDateOnly(toDate);
    const requestedDays = getInclusiveLeaveDays(fromDate, toDate);
    const today = new Date();
    const todayString = [
      today.getUTCFullYear(),
      String(today.getUTCMonth() + 1).padStart(2, "0"),
      String(today.getUTCDate()).padStart(2, "0"),
    ].join("-");

    if (!start || !end || !requestedDays) {
      return res.status(400).json({
        message: "Enter valid leave dates, with the end date on or after the start date",
      });
    }

    if (fromDate < todayString) {
      return res.status(400).json({
        message: "Leave cannot start in the past",
      });
    }

    const maxDays = Number(type.maxDays);
    if (!Number.isFinite(maxDays) || maxDays < 1) {
      return res.status(400).json({
        message: "This leave type does not have a valid maximum day allowance",
      });
    }

    const usedDays = await getApprovedDays(req.user.id, type._id);
    const remainingDays = Math.max(0, maxDays - usedDays);

    if (requestedDays > remainingDays) {
      return res.status(400).json({
        message: `This request is for ${requestedDays} calendar days, but only ${remainingDays} remain for ${type.name}`,
      });
    }

    const leave = await LeaveRequest.create({
      employee: req.user.id,
      leaveType: type._id,
      fromDate: start,
      toDate: end,
      reason,
    });

    const employee = await User.findById(req.user.id).select("name");
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipient: admin._id,
          type: "leave_requested",
          title: "New leave request",
          message: `${employee?.name || "An employee"} requested ${type.name} from ${fromDate} to ${toDate}.`,
          link: "/manage-leaves",
        })),
      );
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee see their leaves
exports.myLeaves = async (req, res) => {
  const leaves = await LeaveRequest.find({
    employee: req.user.id || req.user._id,
  }).populate("leaveType");

  res.json(leaves);
};

// Admin see all leaves
exports.allLeaves = async (req, res) => {
  const leaves = await LeaveRequest.find()
    .populate("employee", "name email")
    .populate("leaveType")
    .sort({ createdAt: -1 });

  res.json(leaves);
};

// Admin update status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const leave = await LeaveRequest.findById(req.params.id)
      .populate("leaveType")
      .populate("employee");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status === status) {
      return res.json(leave);
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leave requests can be approved or rejected",
      });
    }

    if (!leave.employee || !leave.leaveType) {
      return res.status(400).json({
        message: "The employee or leave type for this request no longer exists",
      });
    }

    if (status === "approved") {
      const requestedDays = getInclusiveLeaveDays(
        leave.fromDate.toISOString().slice(0, 10),
        leave.toDate.toISOString().slice(0, 10),
      );
      const maxDays = Number(leave.leaveType.maxDays);

      if (!requestedDays || !Number.isFinite(maxDays) || maxDays < 1) {
        return res.status(400).json({
          message: "The leave request has invalid dates or allowance settings",
        });
      }

      const usedDays = await getApprovedDays(leave.employee._id, leave.leaveType._id);
      const remainingDays = Math.max(0, maxDays - usedDays);

      if (requestedDays > remainingDays) {
        return res.status(400).json({
          message: `This request is for ${requestedDays} calendar days, but only ${remainingDays} remain for ${leave.leaveType.name}`,
        });
      }
    }

    leave.status = status;
    await leave.save();

    await Notification.create({
      recipient: leave.employee._id,
      type: status === "approved" ? "leave_approved" : "leave_rejected",
      title: `Leave request ${status}`,
      message: `Your ${leave.leaveType.name} request from ${leave.fromDate.toISOString().slice(0, 10)} to ${leave.toDate.toISOString().slice(0, 10)} was ${status}.`,
      link: "/my-leaves",
    });

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// cancel option for employees
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // ensure employee owns the leave
    if (leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // allow cancel only if pending
    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be cancelled" });
    }

    await leave.deleteOne();

    res.json({ message: "Leave cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
