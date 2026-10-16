/* 日期和提醒规则独立于页面，统一按北京时间的日历日期计算。 */
(function (root) {
  const DAY = 86400000;

  function dateNumber(value) {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / DAY;
  }

  function addDays(value, days) {
    return new Date((dateNumber(value) + days) * DAY).toISOString().slice(0, 10);
  }

  function daysBetween(start, end) {
    return dateNumber(end) - dateNumber(start);
  }

  function todayInChina(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now);
    const get = (type) => parts.find((part) => part.type === type).value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function pregnancyMeta(profile, today) {
    const origin = addDays(profile.estimatedDueDate, -280);
    const elapsed = daysBetween(origin, today);
    const born = profile.actualBirthDate && profile.actualBirthDate <= today;
    return {
      origin, elapsed, born,
      weeks: Math.floor(Math.max(0, elapsed) / 7),
      days: Math.max(0, elapsed) % 7,
      daysToDue: daysBetween(today, profile.estimatedDueDate),
      progress: Math.max(0, Math.min(100, elapsed / 280 * 100)),
      needsStatusConfirmation: !born && elapsed >= 294
    };
  }

  function taskDates(task, profile) {
    if (!task.pregnancyDays) return task;
    const origin = addDays(profile.estimatedDueDate, -280);
    const dates = Object.fromEntries(Object.entries(task.pregnancyDays)
      .map(([key, offset]) => [key, addDays(origin, offset)]));
    return { ...task, ...dates };
  }

  function taskState(task, profile, today) {
    const dated = taskDates(task, profile);
    if (["已完成", "不适用"].includes(task.status)) {
      return { ...dated, group: "finished", color: "gray", label: task.status, rank: 9 };
    }
    // 尚无实际出生日期时，出生后的截止日只能保留为历史估算。
    if (task.dateBasis === "出生后待重算") {
      return { ...dated, group: "later", color: "green", label: "出生后核对", rank: 8 };
    }
    const meta = pregnancyMeta(profile, today);
    if ((meta.born || meta.needsStatusConfirmation) && (task.pregnancyDays || task.pregnancyOnly)) {
      return { ...dated, group: "history", color: "gray", label: "核实记录", rank: 7 };
    }
    // 个人报告的核对节点不是医学截止；节点过去仍保留随访提醒。
    if (dated.reviewByDate && dated.remindFromDate <= today) {
      const distance = daysBetween(today, dated.reviewByDate);
      return { ...dated, group: "current", color: distance <= 7 ? "red" : "yellow",
        label: distance < 0 ? "请核对随访进展" : distance <= 7 ? "临近核对节点" : "现在关注",
        rank: distance <= 7 ? 0 : (task.priority || 3) };
    }
    if (dated.latestDate && dated.latestDate < today) {
      return { ...dated, group: "history", color: "gray", label: "待核实完成", rank: 7 };
    }
    if (dated.remindFromDate <= today) {
      const nearEnd = dated.latestDate && daysBetween(today, dated.latestDate) <= 7;
      return { ...dated, group: "current", color: nearEnd ? "red" : "yellow",
        label: nearEnd ? "临近参考窗口" : "现在关注", rank: nearEnd ? 0 : (task.priority || 3) };
    }
    return { ...dated, group: dated.remindFromDate <= addDays(today, 56) ? "upcoming" : "later",
      color: "green", label: "提前了解", rank: 5 };
  }

  function sortTasks(tasks) {
    return tasks.slice().sort((a, b) => a.rank - b.rank ||
      (a.latestDate || a.idealStartDate).localeCompare(b.latestDate || b.idealStartDate));
  }

  const api = { addDays, daysBetween, todayInChina, pregnancyMeta, taskDates, taskState, sortTasks };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PregnancyTimeline = api;
})(typeof window === "undefined" ? this : window);
