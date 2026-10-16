const SITE_CONFIG = {
  passwordHash: "8df3ed3d092519e2116e57ac7061603aeb67a4f25583e36087004f25376f4192",
  accessKey: "pregnancy_access_v1"
};
const DATA = window.PREGNANCY_DATA;
const timeline = window.PregnancyTimeline;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
}

function updatePregnancyMeta(today) {
  const p = DATA.pregnancy;
  const m = timeline.pregnancyMeta(p, today);
  setText("[data-today-pill]", `今天 · ${today} · 北京时间`);
  setText("[data-week-title]", m.born ? "已记录出生" : m.needsStatusConfirmation ? "待更新当前状态" :
    m.elapsed < 0 ? "请核对孕期日期" : p.datingConflict ? `孕周待核对 · 暂算 ${m.weeks} 周 + ${m.days} 天` : `孕 ${m.weeks} 周 + ${m.days} 天`);
  setText("[data-due-copy]", `推算预产期 ${p.estimatedDueDate}。${p.datingBasis}。孕周每天更新，实际产检安排以医院为准。`);
  setText("[data-month-label]", m.born ? `出生日期 ${p.actualBirthDate}` : p.datingSource === "医院报告" ? "按医院报告日期计算" : "AI 日历推算");
  setText("[data-key-countdown]", m.born ? "后续提醒需按实际出生日期核对" : m.needsStatusConfirmation ? "已超原估算范围，请补充实际进展" :
    m.daysToDue >= 0 ? `距估算预产期 ${m.daysToDue} 天` : `已到原估算预产期后 ${-m.daysToDue} 天，请核对产检安排`);
  const records = DATA.angelRecords?.reports || [];
  const originalCount = new Set(records.filter((r) => r.attachment?.validPdfSaved)
    .map((r) => r.attachment.documentId || r.id)).size;
  const reviewedCount = new Set(records.filter((r) => r.attachment?.pdfContentReviewed)
    .map((r) => r.attachment.documentId || r.id)).size;
  setText("[data-record-freshness]", `最后收录报告：${p.lastMedicalRecordDate}；家庭信息更新：${p.lastFamilyUpdateDate}。已整理 ${records.length} 条安琪儿报告，有效 PDF 原件已存 ${originalCount} 份，其中 ${reviewedCount} 份已逐页复核；其余原件状态见检查记录。`);
  setText("[data-hospital]", `主要产检：${p.location.prenatalHospital}；生产医院：${p.location.deliveryHospital}。`);
  setText("[data-next-window]", `${today} 至 ${timeline.addDays(today, 56)} 的提醒范围，具体检查日期以医生和医院为准。`);
  document.documentElement.style.setProperty("--pregnancy-progress", `${m.progress.toFixed(1)}%`);
}

function taskMarkup(task, compact = false) {
  const dateLine = task.referenceDateNote || (task.dateBasis === "出生后待重算" ? "出生前先了解流程；实际办理日期和期限需按出生日期及届时政策重算。" :
    task.latestDate ? `参考安排：${task.idealStartDate} 至 ${task.latestDate}；提前提醒：${task.remindFromDate}。` :
    `资料整理自 ${task.idealStartDate} 开始，无医学截止日。`);
  const stateLine = task.group === "history" ? "原参考日期已过或阶段已改变，实际完成情况尚未登记。先核对已有报告，不直接补做旧项目。" : task.whyItMatters;
  const sources = task.sources.map((id) => DATA.sources.find((source) => source.id === id)).filter(Boolean);
  const details = compact ? `<a class="task-link" href="tasks.html#${escapeHTML(task.id)}">查看材料与待问问题</a>` : `
    <p>${escapeHTML(task.gestationalWindow)} · ${escapeHTML(task.localVerification)}</p>
    <p>登记状态：${escapeHTML(task.status)}（${escapeHTML(task.recordAsOf || "日期待补充")}）；窗口提示由日期计算，不代表检查结果。</p>
    ${task.completionVerification ? `<p>${escapeHTML(task.completionVerification)}</p>` : ""}
    <details class="task-details"><summary>材料、待问问题与来源</summary>
      <h4>准备材料</h4><ul>${task.prepItems.map((v) => `<li>${escapeHTML(v)}</li>`).join("")}</ul>
      <h4>需要确认</h4><ul>${task.questionsToAsk.map((v) => `<li>${escapeHTML(v)}</li>`).join("")}</ul>
      <p>${escapeHTML(task.dateNote || task.basisNote || "参考安排需结合个人实际核实。")}</p>
      ${task.doctorInstruction ? `<p>医生报告原文：${escapeHTML(task.doctorInstruction)}</p><p><a href="${escapeHTML(task.recordSource.href)}">${escapeHTML(task.recordSource.title)}</a></p>` : ""}
      <p>${sources.length ? sources.map((source) => `<a href="sources.html#${escapeHTML(source.id)}">${escapeHTML(source.title)}</a>`).join(" · ") : "依据本次家庭信息和资料整理需要。"}</p>
    </details>`;
  return `<article class="task" id="${compact ? "home-" : ""}${escapeHTML(task.id)}">
    <div class="task-icon task-icon-${escapeHTML(task.color)}" aria-hidden="true">${task.group === "history" ? "录" : "记"}</div>
    <div><h3>${escapeHTML(task.title)}</h3><p>${escapeHTML(stateLine)}</p><p>${escapeHTML(dateLine)}</p>${details}</div>
    <span class="badge badge-${escapeHTML(task.color)}">${escapeHTML(task.label)}</span></article>`;
}

function renderRecordOverview() {
  const records = (DATA.angelRecords?.reports || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const latest = document.querySelector("[data-latest-reports]");
  if (latest && records.length) {
    const latestDate = records[0].date;
    setText("[data-latest-report-date]", `最近检查日期：${latestDate}；正文与原件保存状态分别记录。`);
    latest.innerHTML = records.filter((r) => r.date === latestDate).map((r) => `
      <div class="memory-note"><h3>${escapeHTML(r.project)}</h3>
      <p>医生结论原文</p><ul>${(r.doctorConclusions?.verbatim || []).map((v) => `<li>${escapeHTML(v)}</li>`).join("")}</ul>
      <a href="records.html#${escapeHTML(r.id)}">查看测值、完整记录和原件状态</a></div>`).join("");
  }
  const container = document.querySelector("[data-record-timeline]");
  if (!container) return;
  const groups = new Map();
  records.forEach((r) => {
    if (!groups.has(r.date)) groups.set(r.date, []);
    groups.get(r.date).push(r);
  });
  container.innerHTML = Array.from(groups).map(([date, rows]) => `
    <div class="timeline-item"><div class="timeline-date">${escapeHTML(date)}</div><div>
    <h3 class="timeline-title">${rows.length} 份检查记录</h3>
    <p class="timeline-text">${escapeHTML(rows.map((r) => r.project).join("；"))}</p>
    <a href="records.html#${escapeHTML(rows[0].id)}">查看当天记录</a></div></div>`).join("");
}

function renderTasks(today) {
  const all = timeline.sortTasks(DATA.tasks.map((task) => timeline.taskState(task, DATA.pregnancy, today)));
  const home = document.querySelector("[data-home-tasks]");
  if (home) {
    const selected = all.filter((task) => ["current", "upcoming"].includes(task.group)).slice(0, 5);
    home.innerHTML = selected.length ? selected.map((task) => taskMarkup(task, true)).join("") : "<p>当前没有已登记的近期事项，请结合最新产检安排补充。</p>";
  }
  for (const group of ["current", "upcoming", "history", "later", "finished"]) {
    const el = document.querySelector(`[data-task-group="${group}"]`);
    if (!el) continue;
    const rows = all.filter((task) => task.group === group);
    el.innerHTML = rows.length ? rows.map((task) => taskMarkup(task)).join("") : "<p class=\"detail-text\">此分组暂无已登记事项。</p>";
    setText(`[data-task-count="${group}"]`, `${rows.length} 项`);
  }
}

function renderSources() {
  const el = document.querySelector("[data-sources]");
  if (!el) return;
  // 保留旧页面的简写锚点，历史链接继续可用。
  const aliases = {
    "source-national-basic-public-health": "national-basic-public-health",
    "source-pregnancy-care-guide-2018": "pregnancy-care-guide-2018",
    "source-acog-ectopic-pregnancy": "acog-ectopic-pregnancy",
    "source-cleveland-hcg": "cleveland-hcg",
    "source-shaanxi-maternity-faq-2023": "shaanxi-maternity-faq",
    "source-xian-maternity-treatment-2023": "xian-maternity-treatment",
    "source-xian-maternity-claim-2025": "xian-maternity-claim",
    "source-shaanxi-two-screenings-2019": "shaanxi-two-screenings",
    "source-shaanxi-childcare-subsidy-2025": "shaanxi-childcare-subsidy",
    "source-shaanxi-population-family-planning-regulation": "shaanxi-population-family-planning",
    "source-shaanxi-newborn-one-thing-2024": "shaanxi-newborn-one-thing",
    "source-shaanxi-resident-medical-insurance-newborn-2025": "shaanxi-resident-medical-insurance-newborn",
    "source-gov-tax-childcare-deduction-2023": "gov-tax-childcare-deduction"
  };
  el.innerHTML = DATA.sources.map((source) => `<article class="source-card" id="${escapeHTML(source.id)}">
    ${aliases[source.id] ? `<span id="${aliases[source.id]}"></span>` : ""}
    <h3>${escapeHTML(source.title)}</h3>
    <p>${escapeHTML(source.organization)} · 查阅：${escapeHTML(source.lastReviewedDate || source.accessedDate)}${source.publishedDate ? ` · 发布：${escapeHTML(source.publishedDate)}` : ""}</p>
    <p>${escapeHTML(source.note)}</p><a class="button-link secondary" href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">查看原文</a></article>`).join("");
}

let displayedDate;
function refreshDate() {
  const today = timeline.todayInChina();
  if (today === displayedDate) return;
  updatePregnancyMeta(today);
  renderTasks(today);
  displayedDate = today;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function initAccessGate() {
  const gate = document.getElementById("accessGate");
  const form = document.getElementById("accessForm");
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("gateError");
  const logout = document.getElementById("logoutButton");
  if (!gate || !form || !input || !error) return;

  function unlock() {
    gate.classList.add("hidden");
  }

  if (localStorage.getItem(SITE_CONFIG.accessKey) === "true") {
    unlock();
  } else {
    gate.classList.remove("hidden");
    input.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const hash = await sha256(input.value);
    if (hash === SITE_CONFIG.passwordHash) {
      localStorage.setItem(SITE_CONFIG.accessKey, "true");
      error.classList.remove("show");
      unlock();
    } else {
      error.classList.add("show");
      input.select();
    }
  });

  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem(SITE_CONFIG.accessKey);
      gate.classList.remove("hidden");
      input.value = "";
      input.focus();
    });
  }
}


refreshDate();
renderSources();
renderRecordOverview();
initAccessGate();
if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView();
}
// 页面跨过午夜或从后台返回时更新日期，不改动事实记录日期。
setInterval(refreshDate, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshDate();
});
