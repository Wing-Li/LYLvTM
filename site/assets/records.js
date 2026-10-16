/* 安琪儿匿名报告列表；报告原文与整理说明分别展示。 */
(function () {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const list = (items, emptyText) => items?.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="record-note">${escapeHtml(emptyText)}</p>`;

  function metadata(pairs) {
    return `<dl class="record-meta">${pairs.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
  }

  function resultTable(rows, title, showReference) {
    if (!rows?.length) return "";
    const showResult = rows.some((row) => row.reportedResult);
    return `<div class="record-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(title)}，可横向滚动"><table class="record-table"><caption>${escapeHtml(title)}</caption><thead><tr><th scope="col">项目</th><th scope="col">结果</th><th scope="col">单位</th>${showReference ? '<th scope="col">报告参考范围</th>' : ""}${showResult ? '<th scope="col">报告结论</th>' : ""}</tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${escapeHtml(row.name)}${row.englishName ? `<small>${escapeHtml(row.englishName)}</small>` : ""}${row.method ? `<small>方法：${escapeHtml(row.method)}</small>` : ""}${row.source ? `<small>来源：${escapeHtml(row.source)}</small>` : ""}</th><td>${escapeHtml(row.value)}${row.reportFlag ? ` <span class="record-flag" aria-label="原报告标记">${escapeHtml(row.reportFlag)}</span>` : ""}${row.note ? `<small>${escapeHtml(row.note)}</small>` : ""}${row.valueNote ? `<small>${escapeHtml(row.valueNote)}</small>` : ""}</td><td>${escapeHtml(row.unit || "未列")}</td>${showReference ? `<td>${escapeHtml(row.referenceRange ?? "未列")}${row.referenceRangeNote ? `<small>${escapeHtml(row.referenceRangeNote)}</small>` : ""}${row.referenceRangeSource ? `<small>来源：${escapeHtml(row.referenceRangeSource)}</small>` : ""}</td>` : ""}${showResult ? `<td>${escapeHtml(row.reportedResult || "未列")}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderReport(report) {
    const facts = report.facts;
    const doctor = report.doctorConclusions;
    const attachment = report.attachment;
    const factNotes = [
      facts.ultrasoundFindingsNote,
      facts.referenceRangeNote,
      facts.supplementaryComments,
    ].filter(Boolean);
    return `<details class="card record-card" id="${escapeHtml(report.id)}">
      <summary><span class="record-summary-top">${escapeHtml(report.reportTime || "时间未列")} · ${escapeHtml(report.type)}</span>
        <span class="record-summary-title">${escapeHtml(report.project)}</span>
        <span class="record-summary-note">${escapeHtml(report.institution || "安琪儿 · 院区待核对")} · ${attachment.pdfContentReviewed ? `PDF 内容已复核 · ${attachment.pageCount} 页` : attachment.validPdfSaved ? "已关联本地有效原件" : "依据小程序详情 · 待有效原件"} · 展开查看</span>
      </summary>
      <div class="record-body">
        ${metadata([
          ["报告日期", `${report.date}${report.reportTime ? ` ${report.reportTime}` : ""}`],
          ["日期来源", report.dateSource], ["报告机构", report.institution], ["机构说明", report.institutionNote],
          ["检测机构", report.reportingInstitutions?.join("；")],
          ["申请科室", report.requestingDepartment], ["送检科室", report.examiningDepartment],
          ["送检部位", report.examinedPart], ["标本类型", report.sampleType], ["附件报告名称", report.pdfTitle],
          ["采样日期", report.sampleCollectedDate], ["小程序列表时间", report.listDisplayedAt], ["小程序详情原始日期显示", report.detailReportDateRaw],
          ["小程序详情报告时间", report.miniAppReportTime],
          ["附件报告时间", report.pdfReportTime], ["附件检查时间", report.pdfExaminedAt], ["附件打印时间", report.pdfPrintedAt],
          ["附件采样时间", report.pdfSampleCollectedAt],
          ["附件接收时间", report.pdfSampleReceivedAt], ["附件检测时间", report.pdfTestedAt], ["附件检验时间", report.pdfExaminationTime],
        ])}
        <p class="record-attachment"><strong>资料状态：</strong>${escapeHtml(attachment.status)}。</p>
        <section class="record-section"><h3>事实记录</h3>
          ${metadata([
            ["报告所写末次月经", facts.reportedLastMenstrualPeriod], ["报告所写停经时间", facts.reportedAmenorrhea],
            ["报告所写孕周", facts.reportedGestationalAge], ["附件临床诊断栏原文", facts.pdfClinicalDiagnosisVerbatim],
            ["空腹状态", facts.fastingStatus],
            ["筛查内容", facts.screeningConditionsVerbatim], ["检测方法", facts.screeningMethodVerbatim], ["检测平台", facts.testingPlatformVerbatim],
          ])}
          ${resultTable(facts.measurements, "报告测值", false)}
          ${resultTable(facts.results, "检验结果", true)}
          ${(facts.associatedPanels || []).map((panel) => `<h4>${escapeHtml(panel.project)} · 关联项目</h4><p class="record-note">${escapeHtml(panel.source || "关联报告")}${panel.listDetailRead ? "；列表详情已核对。" : "；列表详情尚未逐项核对，不另计为已读取报告。"}</p>${resultTable(panel.results, panel.project, true)}`).join("")}
          ${facts.ultrasoundFindingsVerbatim?.length ? `<h4>超声所见原文</h4>${list(facts.ultrasoundFindingsVerbatim, "")}` : ""}
          ${factNotes.map((note) => `<p class="record-note">${escapeHtml(note)}</p>`).join("")}
        </section>
        <section class="record-section"><h3>医生结论</h3>
          ${doctor.sourceField ? `<p class="record-note">来自报告“${escapeHtml(doctor.sourceField)}”栏。</p>` : ""}
          ${list(doctor.verbatim, "当前已查看内容中未单独录入医生结论；不表示医生没有意见。")}
          ${doctor.note ? `<p class="record-note">${escapeHtml(doctor.note)}</p>` : ""}
        </section>
        <section class="record-section"><h3>AI整理</h3>${list(report.aiOrganization.notes, "尚无额外整理说明。")}</section>
        <section class="record-section"><h3>待确认问题</h3>${list(report.pendingQuestions.items, "当前未另列问题；以实际就诊沟通为准。")}</section>
        <section class="record-section"><h3>核对范围</h3>${report.contentReviewedAt ? `<p class="record-note">内容复核：${escapeHtml(report.contentReviewedAt)} · ${escapeHtml(report.contentReviewBasis)}</p>` : ""}<p class="record-note">${escapeHtml(report.transcriptionCompleteness || "核对范围待补充")}</p></section>
      </div>
    </details>`;
  }

  function renderList(reports, selectedDate = "") {
    const selected = reports.filter((report) => !selectedDate || report.date === selectedDate);
    let previousDate;
    return selected.map((report) => {
      const heading = previousDate === report.date ? "" : `<h3 class="record-day">${escapeHtml(report.date)}</h3>`;
      previousDate = report.date;
      return heading + renderReport(report);
    }).join("") || '<p class="record-notice">这个日期暂未收录报告。</p>';
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { renderList, renderReport };
  if (typeof document === "undefined") return;
  const data = window.PREGNANCY_DATA?.angelRecords;
  const coverageElement = document.getElementById("recordCoverage");
  const listElement = document.getElementById("recordList");
  const filter = document.getElementById("recordDateFilter");
  const count = document.getElementById("recordCount");
  if (!data || !coverageElement || !listElement || !filter || !count) return;
  const savedReports = data.reports.filter((report) => report.attachment.validPdfSaved).length;
  const savedFiles = new Set(data.reports.filter((report) => report.attachment.validPdfSaved).map((report) => report.attachment.documentId)).size;
  coverageElement.innerHTML = `<div class="record-status-row"><span class="badge ${data.coverage.listComplete ? "badge-blue" : "badge-yellow"}">${data.coverage.listComplete ? "近一年列表已核对" : "近一年导入尚未完整"}</span><span class="badge badge-gray">已整理 ${data.reports.length} 份报告</span><span class="badge badge-gray">${savedFiles} 份有效原件 · 关联 ${savedReports} 份报告</span></div><p class="record-note">筛选范围：${escapeHtml(data.coverage.startDate)} 至 ${escapeHtml(data.coverage.endDate)} · 整理日期：${escapeHtml(data.updatedAt)}</p><p class="record-note">${escapeHtml(data.coverage.note)}</p>`;
  filter.innerHTML = '<option value="">全部日期</option>' + [...new Set(data.reports.map((report) => report.date))].map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  function render() {
    listElement.innerHTML = renderList(data.reports, filter.value);
    const shown = data.reports.filter((report) => !filter.value || report.date === filter.value).length;
    count.textContent = `当前显示 ${shown} / ${data.reports.length} 份，点击报告展开详情。`;
  }
  function revealHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!data.reports.some((report) => report.id === id)) return;
    filter.value = "";
    render();
    const target = document.getElementById(id);
    target.open = true;
    target.scrollIntoView({ block: "start" });
  }
  filter.addEventListener("change", render);
  window.addEventListener("hashchange", revealHash);
  render();
  revealHash();
})();
