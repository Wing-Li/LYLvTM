/* 验证日历和提醒边界，不从未录入资料推断医疗完成状态。 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const t = require("../site/assets/timeline.js");
const read = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "../data", name + ".json"), "utf8"));
const profile = read("pregnancy");
const tasks = read("tasks");
const task = (id) => tasks.find((row) => row.id === id);

test("北京时间在 UTC 16 点跨日", () => {
  assert.equal(t.todayInChina(new Date("2026-10-15T15:59:59Z")), "2026-10-15");
  assert.equal(t.todayInChina(new Date("2026-10-15T16:00:00Z")), "2026-10-16");
});

test("医院口径为 24 周加 6 天，跨日进入 25 周", () => {
  const m = t.pregnancyMeta(profile, "2026-10-16");
  assert.equal(m.origin, "2026-04-25");
  assert.equal(m.weeks, 24); assert.equal(m.days, 6); assert.equal(m.daysToDue, 106);
  assert.equal(t.pregnancyMeta(profile, "2026-10-17").weeks, 25);
  assert.equal(t.pregnancyMeta(profile, "2026-10-17").days, 0);
  assert.equal(t.addDays("2026-10-16", 56), "2026-12-11");
});

test("日期差不受运行机器夏令时影响，也正确跨闰日", () => {
  assert.equal(t.daysBetween("2026-03-07", "2026-03-10"), 3);
  assert.equal(t.daysBetween("2028-02-28", "2028-03-01"), 2);
});

test("预产期校正会移动孕周任务，不移动固定家庭计划", () => {
  const corrected = { ...profile, estimatedDueDate: "2027-02-11" };
  assert.equal(t.taskDates(task("gdm-screening-window"), corrected).idealStartDate, "2026-10-22");
  assert.equal(t.taskDates(task("confirm-current-dating"), corrected).idealStartDate, "2026-10-16");
});

test("糖耐任务从未提醒到提醒中，结束日当天仍保留", () => {
  const row = task("gdm-screening-window");
  assert.equal(t.taskState(row, profile, "2026-09-25").group, "upcoming");
  assert.equal(t.taskState(row, profile, "2026-09-26").group, "current");
  assert.equal(t.taskState(row, profile, "2026-10-30").color, "yellow");
  assert.equal(t.taskState(row, profile, "2026-10-31").color, "red");
  assert.equal(t.taskState(row, profile, "2026-11-07").group, "current");
  assert.equal(t.taskState(row, profile, "2026-11-08").label, "待核实完成");
});

test("历史早孕事项进入待核实，不推断已漏检或已完成", () => {
  // 明确构造尚无完成记录的情形，避免真实报告补录改变测试前提。
  const state = t.taskState({ ...task("nt-appointment-window"), status: "未开始" }, profile, "2026-10-16");
  assert.equal(state.group, "history"); assert.equal(state.color, "gray");
  assert.equal(state.status, "未开始"); assert.equal(state.label, "待核实完成");
});

test("已完成和不适用优先于日期，不重复提醒", () => {
  for (const status of ["已完成", "不适用"]) {
    const state = t.taskState({ ...task("nt-appointment-window"), status }, profile, "2026-10-16");
    assert.equal(state.group, "finished"); assert.equal(state.label, status);
  }
});

test("资料整理没有伪造医学截止日，长期保留待核实", () => {
  const state = t.taskState(task("collect-angel-electronic-records"), profile, "2026-12-01");
  assert.equal(state.latestDate, null); assert.equal(state.group, "current"); assert.equal(state.color, "yellow");
});

test("未来 8 周按提醒开始日归组，出生计划不启动伪倒计时", () => {
  assert.equal(t.taskState(task("free-ultrasound-third-window"), profile, "2026-10-16").group, "upcoming");
  assert.equal(t.taskState(task("birth-one-thing-and-newborn-medical-insurance"), profile, "2027-05-06").label, "出生后核对");
});

test("出生后或超过原估算范围不继续显示普通孕期状态", () => {
  assert.equal(t.pregnancyMeta(profile, "2027-02-18").needsStatusConfirmation, true);
  const born = { ...profile, actualBirthDate: "2027-01-25" };
  assert.equal(t.pregnancyMeta(born, "2027-01-25").born, true);
  assert.equal(t.taskState(task("gdm-screening-window"), born, "2027-01-25").group, "history");
});

test("动态计算不改写原始记录，主页优先当前与后续任务", () => {
  const before = JSON.stringify({ profile, tasks });
  const states = t.sortTasks(tasks.map((row) => t.taskState(row, profile, "2026-10-16")));
  const home = states.filter((row) => ["current", "upcoming"].includes(row.group)).slice(0, 5);
  assert.ok(home.some((row) => row.id === "gdm-screening-window"));
  assert.ok(!home.some((row) => row.id === "ask-doctor-hcg-progesterone-followup"));
  assert.equal(JSON.stringify({ profile, tasks }), before);
});

test("医生报告核对节点临近时提醒，节点过去仍保留随访", () => {
  const row = task("angel-20261010-fetal-echo");
  assert.equal(t.taskState(row, profile, "2026-10-16").color, "yellow");
  assert.equal(t.taskState(row, profile, "2026-10-17").label, "临近核对节点");
  assert.equal(t.taskState(row, profile, "2026-10-24").group, "current");
  const after = t.taskState(row, profile, "2026-10-25");
  assert.equal(after.group, "current");
  assert.equal(after.label, "请核对随访进展");
  assert.equal(after.latestDate, null);
});

test("报告随访完成后停止提醒，出生后转入记录核对", () => {
  const row = task("angel-20261010-fetal-echo");
  assert.equal(t.taskState({ ...row, status: "已完成" }, profile, "2026-11-01").group, "finished");
  assert.equal(t.taskState(row, { ...profile, actualBirthDate: "2027-01-25" }, "2027-01-26").group, "history");
});

test("本次首页包含五个优先事项，报告复核不误标随访完成", () => {
  const home = t.sortTasks(tasks.map((row) => t.taskState(row, profile, "2026-10-16")))
    .filter((row) => ["current", "upcoming"].includes(row.group)).slice(0, 5).map((row) => row.id);
  for (const id of ["confirm-current-dating", "angel-20260722-cervical-followup", "angel-20261010-fetal-echo", "angel-20261010-systemic-ultrasound-followup", "gdm-screening-window"]) {
    assert.ok(home.includes(id));
    assert.notEqual(task(id).status, "已完成");
  }
  assert.equal(task("free-ultrasound-first-window").status, "已完成");
});
