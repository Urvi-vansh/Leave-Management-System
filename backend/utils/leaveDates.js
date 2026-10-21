const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value) => {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value ? date : null;
};

const getInclusiveLeaveDays = (fromDate, toDate) => {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);

  if (!start || !end || end < start) {
    return null;
  }

  return Math.floor((end - start) / 86400000) + 1;
};

module.exports = { parseDateOnly, getInclusiveLeaveDays };
