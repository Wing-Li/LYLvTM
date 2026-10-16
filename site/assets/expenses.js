/* 金额来自已核对的费用页面，保持不同支付与抵扣方式的口径。 */
(function () {
  "use strict";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const money = (value) => value === null || value === undefined ? "未显示" : (value / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountLabel = (value) => value === null || value === undefined ? "未显示" : `${money(value)} 元`;
  const amountRows = (pairs) => `<dl class="expense-amounts">${pairs.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(amountLabel(value))}</dd></div>`).join("")}</dl>`;

  function renderBill(item) {
    const pending = item.status !== "已支付";
    const difference = item.reconciliation.unexplainedDifferenceFen;
    const status = difference ? `差额 ${money(difference)} 元待核实` : pending ? `剩余待支付 ${amountLabel(item.remainingToPayFen)}` : `页面已支付 ${amountLabel(item.displayedPaidFen)}`;
    return `<details class="card record-card" id="${escapeHtml(item.id)}"><summary>
      <span class="record-summary-top">${escapeHtml(item.status)}</span>
      <span class="record-summary-title">${escapeHtml(item.visitTime)} 就诊 · 原账单 ${money(item.billTotalFen)} 元</span>
      <span class="record-summary-note">${escapeHtml(status)}${item.paymentTime ? ` · ${escapeHtml(item.paymentTime)} 支付` : ""} · 展开核对</span>
    </summary><div class="record-body">
      <h3>事实记录</h3>
      ${amountRows([
        ["账单原额", item.billTotalFen], ["账单折扣", item.discountFen], ["套餐抵扣", item.packagePaymentFen],
        ["个人支付", item.personalPaymentFen], ["院内储值消费", item.storedValuePaymentFen],
        [pending ? "剩余待支付" : "页面已支付", pending ? item.remainingToPayFen : item.displayedPaidFen],
      ])}
      <p class="record-note">折扣、套餐抵扣按抵减金额展示；“未显示”表示原页面未列出该字段，不等于已确认 0 元。</p>
      <ul>${item.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>
      <p class="record-note">发票信息：${item.invoiceDisplay === "null" ? "原页面显示字面值 null，开票状态待核实。" : escapeHtml(item.invoiceDisplay || "未显示。")}</p>
      <section class="record-section"><h3>金额核对</h3>
        <p class="expense-check ${item.reconciliation.passed ? "" : "pending"}">${item.reconciliation.passed ? "已显示金额可核对一致。" : `尚有 ${money(difference)} 元差额需要解释。`}${item.reconciliation.note ? ` ${escapeHtml(item.reconciliation.note)}` : ""}</p>
      </section>
    </div></details>`;
  }

  function summaryCard(label, value, note) {
    return `<article class="card expense-total"><h3>${escapeHtml(label)}</h3><strong class="expense-value">${money(value)} <small>元</small></strong><p>${escapeHtml(note)}</p></article>`;
  }

  function renderSummary(data) {
    const sum = data.paidSubtotal;
    return [
      summaryCard("个人支付", sum.personalPaymentFen, "支付明细中明确列出的个人支付。"),
      summaryCard("院内储值消费", sum.storedValuePaymentFen, "从院内储值账户支付的消费，另于个人支付记录。"),
      summaryCard("套餐抵扣", sum.packagePaymentFen, "本批已支付账单被套餐覆盖的金额，不代表套餐购买价。"),
      summaryCard("账单折扣", sum.discountFen, "原页面明确列出的折扣抵减金额。"),
    ].join("");
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { money, renderBill, renderSummary };
  if (typeof document === "undefined") return;
  const data = window.PREGNANCY_DATA?.angelExpenses;
  if (!data) return;
  const paid = data.items.filter((item) => item.status === "已支付");
  const pending = data.items.filter((item) => item.status !== "已支付");
  const sum = data.paidSubtotal;
  const coverage = document.getElementById("expenseCoverage");
  if (!coverage) return;
  coverage.innerHTML = `<div class="record-status-row"><span class="badge ${data.coverage.currentVisibleListComplete ? "badge-blue" : "badge-yellow"}">${data.coverage.currentVisibleListComplete ? "当前可见清单已遍历" : "当前可见清单尚未完整核对"}</span><span class="badge badge-gray">${paid.length} 笔已支付 · ${pending.length} 笔位于待支付栏目</span></div><p class="record-note">核对日期：${escapeHtml(data.updatedAt)}。${escapeHtml(data.coverage.note)}</p>`;
  document.getElementById("expenseSummaryScope").textContent = sum.scope;
  document.getElementById("expenseSummary").innerHTML = renderSummary(data);
  const differences = paid.filter((item) => item.reconciliation.passed === false);
  document.getElementById("expenseReconciliation").innerHTML = `<p><strong>页面已支付合计 ${money(sum.displayedPaidFen)} 元</strong> = 个人支付 ${money(sum.personalPaymentFen)} 元 + 储值消费 ${money(sum.storedValuePaymentFen)} 元。</p>
    <p>原账单 ${money(sum.billTotalFen)} − 已显示折扣 ${money(sum.discountFen)} − 套餐抵扣 ${money(sum.packagePaymentFen)} − 已支付 ${money(sum.displayedPaidFen)} = ${money(sum.unexplainedDifferenceFen)} 元待解释差额。</p>
    ${differences.map((item) => `<p><a href="#${escapeHtml(item.id)}">查看 ${escapeHtml(item.visitTime)} 就诊、${escapeHtml(item.paymentTime?.slice(11) || "时间未列")} 支付的账单</a>：${escapeHtml(item.reconciliation.note)}</p>`).join("")}
    <p class="record-note">${escapeHtml(sum.note)}</p>`;
  document.getElementById("expenseBalance").innerHTML = `<h2 class="section-title">储值余额 · 时点快照</h2><strong class="expense-value">${money(data.accountBalance.amountFen)} <small>元</small></strong><p class="record-note">观察日期：${escapeHtml(data.accountBalance.observedOn)}</p><p class="record-note">${escapeHtml(data.accountBalance.note)}</p>`;
  document.getElementById("expensePendingSummary").innerHTML = `<h2 class="section-title">待支付栏目 · 单独保留</h2>${pending.map((item) => `<p class="record-note">${escapeHtml(item.visitTime)} 就诊</p><strong class="expense-value">${money(item.remainingToPayFen)} <small>元剩余待支付</small></strong><p class="record-note">原账单 ${money(item.billTotalFen)} 元，套餐抵扣 ${amountLabel(item.packagePaymentFen)}。栏目显示“待支付”不等于仍欠原账单金额。</p>`).join("") || '<p class="record-note">当前未收录待支付栏目账单。</p>'}`;
  document.getElementById("paidExpenseList").innerHTML = paid.map(renderBill).join("");
  document.getElementById("pendingExpenseList").innerHTML = pending.map(renderBill).join("");
  document.getElementById("expenseQuestions").innerHTML = data.unconfirmed.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
  function revealHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!data.items.some((item) => item.id === id)) return;
    const target = document.getElementById(id);
    target.open = true;
    target.scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();
})();
