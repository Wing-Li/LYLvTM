const SITE_CONFIG = {
  passwordHash: "8df3ed3d092519e2116e57ac7061603aeb67a4f25583e36087004f25376f4192",
  accessKey: "pregnancy_access_v1",
  lmp: "2026-04-30",
  dueDate: "2027-02-04",
  buildDate: "2026-05-24"
};

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(a, b) {
  return Math.floor((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function updatePregnancyMeta() {
  const today = parseLocalDate(SITE_CONFIG.buildDate);
  const todayText = formatDate(today);
  const gestationalDays = daysBetween(SITE_CONFIG.lmp, todayText);
  const weeks = Math.max(0, Math.floor(gestationalDays / 7));
  const days = Math.max(0, gestationalDays % 7);
  const progress = Math.min(100, Math.max(0, gestationalDays / 280 * 100));
  const thirteenWeeks = new Date(parseLocalDate(SITE_CONFIG.lmp).getTime() + 13 * 7 * 86400000);
  const daysTo13w = Math.ceil((thirteenWeeks - today) / 86400000);

  document.querySelectorAll("[data-today-pill]").forEach((el) => {
    el.textContent = `今天 · ${todayText} · 第一次确认`;
  });
  document.querySelectorAll("[data-week-title]").forEach((el) => {
    el.innerHTML = `孕 ${weeks} 周<br>+ ${days} 天`;
  });
  document.querySelectorAll("[data-due-copy]").forEach((el) => {
    el.textContent = `预产期约 ${SITE_CONFIG.dueDate}。现在还很早，后续以医生和早孕 B 超校正为准；页面会随着新检查自动重算提醒。`;
  });
  document.querySelectorAll("[data-month-label]").forEach((el) => {
    el.textContent = `第 ${Math.max(1, Math.ceil((gestationalDays + 1) / 28))} 孕月`;
  });
  document.querySelectorAll("[data-key-countdown]").forEach((el) => {
    el.textContent = daysTo13w >= 0 ? `距离 13 周建册节点约 ${daysTo13w} 天` : "已进入 13 周后，请尽快确认建册/产检状态";
  });
  document.documentElement.style.setProperty("--pregnancy-progress", `${progress.toFixed(1)}%`);
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

updatePregnancyMeta();
initAccessGate();
