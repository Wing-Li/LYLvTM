"""将已核对的安琪儿报告转录整理为匿名页面数据；原件和读取过程留在本地。"""

import argparse
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "private/imports/2026-10-16-angel/working/transcribed-reports.json"
DEFAULT_MANIFEST = ROOT / "private/imports/2026-10-16-angel/manifest.json"
TEXT_FIELDS = (
    "date", "reportTime", "dateSource", "institution", "institutionNote",
    "requestingDepartment", "examiningDepartment", "type", "project", "examinedPart",
    "sampleType", "sampleCollectedDate", "listDisplayedAt", "detailReportDateRaw",
    "pdfReportTime", "pdfSampleCollectedAt", "pdfSampleReceivedAt", "pdfTestedAt", "pdfTitle",
    "miniAppReportTime", "pdfExaminationTime", "pdfExaminedAt", "pdfPrintedAt",
    "contentReviewedAt", "contentReviewBasis",
    "transcriptionCompleteness",
)
FACT_FIELDS = (
    "reportedLastMenstrualPeriod", "reportedAmenorrhea", "reportedGestationalAge",
    "supplementaryComments", "referenceRangeNote", "pdfClinicalDiagnosisVerbatim",
    "ultrasoundFindingsNote", "screeningConditionsVerbatim", "screeningMethodVerbatim",
    "testingPlatformVerbatim",
    "fastingStatus",
)
RESULT_FIELDS = ("name", "englishName", "value", "valueNote", "unit", "referenceRange", "reportedResult", "reportFlag", "note", "referenceRangeNote", "referenceRangeSource", "method", "source")


def pick_text(source, fields):
    """每次重新构造对象，防止新增的私密字段被顺带发布。"""
    return {key: source[key] for key in fields if key in source and (source[key] is None or isinstance(source[key], str))}


def string_list(value):
    return [item for item in value if isinstance(item, str)] if isinstance(value, list) else []


def editorial_text(value):
    return value.replace("主代理已", "已").replace("待主代理", "待").replace("主代理", "").replace("存入associatedPanels", "作为关联项目分组收录")


def safe_section(source, array_key):
    source = source if isinstance(source, dict) else {}
    return {**pick_text(source, ("sourceField", "note")), array_key: string_list(source.get(array_key))}


def attachment_status(attachment):
    """页面只展示资料进度；下载错误等技术细节留在本地核对记录。"""
    if attachment.get("validPdfSaved"):
        if attachment.get("pdfContentReviewed"):
            return f"PDF 原件已保存并完成逐页核对（{attachment['pageCount']} 页）"
        return "PDF 原件已保存，内容待复核"
    return "小程序报告内容已整理，PDF 原件待补充"


def validate_public_records(data):
    """只校验匿名摘要格式，不把日期差异解释为医学结论。"""
    def allow_keys(value, allowed, label):
        if not isinstance(value, dict) or set(value) - set(allowed):
            raise ValueError(f"{label} 存在未列入白名单的字段")

    allow_keys(data, ("updatedAt", "source", "coverage", "privacyNote", "reports"), "报告集合")
    date.fromisoformat(data["updatedAt"])
    coverage = data["coverage"]
    allow_keys(coverage, ("selection", "startDate", "endDate", "listComplete", "note"), "核对范围")
    for key in ("startDate", "endDate"):
        date.fromisoformat(coverage[key])
    ids = set()
    for report in data["reports"]:
        allow_keys(report, ("id", *TEXT_FIELDS, "reportingInstitutions", "facts", "doctorConclusions", "aiOrganization", "pendingQuestions", "attachment"), "报告")
        if not re.fullmatch(r"angel-report-\d{8}-(?:[a-z][a-z0-9-]*|\d{4})", report["id"]):
            raise ValueError("报告 ID 必须是项目内部的匿名日期标识")
        if report["id"] in ids:
            raise ValueError("报告 ID 重复")
        ids.add(report["id"])
        date.fromisoformat(report["date"])
        if not report.get("project"):
            raise ValueError("报告缺少检查项目")
        for group in ("facts", "doctorConclusions", "aiOrganization", "pendingQuestions", "attachment"):
            if not isinstance(report.get(group), dict):
                raise ValueError(f"报告缺少 {group} 分区")
        allow_keys(report["facts"], (*FACT_FIELDS, "measurements", "results", "ultrasoundFindingsVerbatim", "associatedPanels"), "事实记录")
        row_groups = [report["facts"].get(group, []) for group in ("measurements", "results")]
        for panel in report["facts"].get("associatedPanels", []):
            allow_keys(panel, ("project", "source", "listDetailRead", "results"), "关联检验分组")
            row_groups.append(panel["results"])
        for rows in row_groups:
            for result in rows:
                allow_keys(result, RESULT_FIELDS, "检查数值")
                if not result.get("name") or result.get("value") is None:
                    raise ValueError("检查数值缺少项目名称或结果，需要核对转录格式")
        for section, key in (("doctorConclusions", "verbatim"), ("aiOrganization", "notes"), ("pendingQuestions", "items")):
            allow_keys(report[section], ("sourceField", "note", key), section)
        allow_keys(report["attachment"], ("visible", "validPdfSaved", "status", "documentId", "pdfContentReviewed", "pageCount"), "附件状态")
        if report["attachment"].get("pdfContentReviewed") and not report["attachment"]["validPdfSaved"]:
            raise ValueError("未取得有效原件，不可标记PDF内容已复核")
        pages = report["attachment"].get("pageCount")
        if pages is not None and (not isinstance(pages, int) or isinstance(pages, bool) or pages < 1):
            raise ValueError("原件页数必须是正整数")
        document_id = report["attachment"].get("documentId")
        if document_id and not re.fullmatch(r"angel-source-\d{8}-[a-z][a-z0-9-]*", document_id):
            raise ValueError("附件标识必须是项目内部的匿名标识")
        if report["attachment"]["validPdfSaved"] and not document_id:
            raise ValueError("已保存有效原件需提供匿名附件标识，以便去除重复文件计数")
    text = json.dumps(data, ensure_ascii=False)
    if re.search(r"private[/\\]|/Users/|file://|\b[0-9a-f]{32}\b|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[\dXx](?!\d)|\.(?:png|jpe?g|pdf)\b", text):
        raise ValueError("匿名报告数据包含疑似身份号码、原始文件名或私密路径，停止生成")
    forbidden = {"sourceScreenshots", "imagePaths", "filePaths", "patientName", "patientId", "orderId", "mobile", "phone", "identityNumber", "statusSource"}
    def inspect(value):
        if isinstance(value, dict):
            if forbidden.intersection(value):
                raise ValueError("匿名报告数据包含私密字段")
            for child in value.values():
                inspect(child)
        elif isinstance(value, list):
            for child in value:
                inspect(child)
    inspect(data)


def convert(source, manifest):
    reports = []
    for original in source["reports"]:
        facts = original.get("facts", {})
        attachment = original.get("attachment", {})
        record = {"id": original["id"], **pick_text(original, TEXT_FIELDS)}
        for key in ("dateSource", "institutionNote", "transcriptionCompleteness"):
            if isinstance(record.get(key), str):
                record[key] = editorial_text(record[key])
        record["reportingInstitutions"] = string_list(original.get("reportingInstitutions"))
        record["facts"] = {
            **pick_text(facts, FACT_FIELDS),
            "measurements": [pick_text(item, RESULT_FIELDS) for item in facts.get("measurements", [])],
            "results": [pick_text(item, RESULT_FIELDS) for item in facts.get("results", [])],
            "ultrasoundFindingsVerbatim": string_list(facts.get("ultrasoundFindingsVerbatim")),
            "associatedPanels": [{
                **pick_text(panel, ("project", "source")),
                "listDetailRead": panel.get("listDetailRead") is True,
                "results": [pick_text(item, RESULT_FIELDS) for item in panel.get("results", [])],
            } for panel in facts.get("associatedPanels", [])],
        }
        record["doctorConclusions"] = safe_section(original.get("doctorConclusions"), "verbatim")
        record["aiOrganization"] = safe_section(original.get("aiOrganization"), "notes")
        record["aiOrganization"]["notes"] = [editorial_text(item) for item in record["aiOrganization"]["notes"]]
        record["pendingQuestions"] = safe_section(original.get("pendingQuestions"), "items")
        record["pendingQuestions"]["items"] = [editorial_text(item) for item in record["pendingQuestions"]["items"]]
        record["attachment"] = {
            "visible": attachment.get("visible") is True,
            "validPdfSaved": attachment.get("validPdfSaved") is True,
            "status": attachment_status(attachment),
            "documentId": attachment.get("documentId") if isinstance(attachment.get("documentId"), str) else None,
            "pdfContentReviewed": attachment.get("pdfContentReviewed") is True,
            "pageCount": attachment.get("pageCount") if attachment.get("validPdfSaved") is True else None,
        }
        reports.append(record)
    requested = manifest.get("requestedRange", {})
    saved_reports = [report for report in reports if report["attachment"]["validPdfSaved"]]
    saved_files = len({report["attachment"]["documentId"] for report in saved_reports})
    missing_originals = len(reports) - len(saved_reports)
    reviewed_files = {report["attachment"]["documentId"]: report["attachment"]["pageCount"]
                      for report in reports if report["attachment"]["pdfContentReviewed"]}
    original_note = (
        f"已保存{saved_files}份不同有效原件，关联{len(saved_reports)}条报告；"
        + (f"其余{missing_originals}条的原件状态见各报告。" if missing_originals else "本次列表报告的原件均已关联。")
    )
    data = {
        "updatedAt": source["transcribedAt"],
        "source": "安琪儿医院小程序的报告详情与附件预览",
        "coverage": {
            "selection": "近一年",
            "startDate": requested.get("expectedStart", "2025-10-16"),
            "endDate": requested.get("expectedEnd", "2026-10-16"),
            "listComplete": manifest.get("reports", {}).get("listComplete") is True and manifest.get("verification", {}).get("allReportDetailsOpened") is True,
            "note": "本次近一年可见列表已逐项打开；" + original_note
                + (f"其中{len(reviewed_files)}份原件、共{sum(reviewed_files.values())}页已完成内容复核。" if reviewed_files else "")
                + "未出现的报告不等同于未检查。",
        },
        "privacyNote": "仅展示匿名摘要，报告原件和读取过程留在本地。",
        "reports": sorted(reports, key=lambda item: (item["date"], item.get("reportTime") or "", item["id"]), reverse=True),
    }
    validate_public_records(data)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    source = json.loads(args.source.read_text(encoding="utf-8"))
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    data = convert(source, manifest)
    target = ROOT / "data/angel-records.json"
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"已生成 {len(data['reports'])} 份匿名报告摘要；近一年范围核对完成：{data['coverage']['listComplete']}。")


if __name__ == "__main__":
    main()
