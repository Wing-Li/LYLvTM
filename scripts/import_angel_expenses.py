"""将已核对的费用截图转录转换为匿名费用摘要，金额始终使用整数分。"""

import argparse
import json
import re
from datetime import datetime, date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "private/imports/2026-10-16-angel/working/transcribed-expenses.json"
AMOUNTS = ("billTotalFen", "discountFen", "packagePaymentFen", "personalPaymentFen", "storedValuePaymentFen", "displayedPaidFen", "remainingToPayFen")
ITEM_TEXT = ("visitTime", "paymentTime", "status", "invoiceDisplay")
SUMMARY_AMOUNTS = AMOUNTS[:-1]


def allow_keys(value, allowed, label):
    if not isinstance(value, dict) or set(value) - set(allowed):
        raise ValueError(f"{label} 存在未列入白名单的字段")


def amount(value):
    if value is not None and (type(value) is not int or value < 0):
        raise ValueError("费用金额必须为非负整数分，未显示的字段保持 null")
    return value


def strings(values):
    return [value for value in values if isinstance(value, str)] if isinstance(values, list) else []


def subtotal(items):
    paid = [item for item in items if item["status"] == "已支付"]
    totals = {key: sum(item.get(key) or 0 for item in paid) for key in SUMMARY_AMOUNTS}
    totals["itemCount"] = len(paid)
    totals["unexplainedDifferenceFen"] = sum(item["reconciliation"].get("unexplainedDifferenceFen") or 0 for item in paid)
    return totals


def validate_public_expenses(data):
    allow_keys(data, ("updatedAt", "source", "currency", "amountUnit", "coverage", "accountBalance", "items", "paidSubtotal", "unconfirmed"), "费用集合")
    date.fromisoformat(data["updatedAt"])
    if data["currency"] != "CNY" or data["amountUnit"] != "分":
        raise ValueError("费用币种或金额单位有误")
    allow_keys(data["coverage"], ("paidListComplete", "pendingListComplete", "currentVisibleListComplete", "feeDateFilterAvailable", "note"), "费用核对范围")
    allow_keys(data["accountBalance"], ("label", "amountFen", "observedOn", "note"), "账户余额")
    amount(data["accountBalance"]["amountFen"])
    ids = set()
    for item in data["items"]:
        allow_keys(item, ("id", *ITEM_TEXT, *AMOUNTS, "detailRead", "facts", "reconciliation"), "账单")
        if not re.fullmatch(r"angel-expense-\d{8}-\d{4}-(?:pending|paid(?:-list\d{2})?)", item["id"]) or item["id"] in ids:
            raise ValueError("账单 ID 必须是唯一的匿名日期标识")
        ids.add(item["id"])
        for field in ("visitTime", "paymentTime"):
            if item.get(field):
                datetime.fromisoformat(item[field])
        if item["status"] not in ("已支付", "待支付页显示"):
            raise ValueError("尚未支持该账单状态，请先核对显示口径")
        for field in AMOUNTS:
            amount(item[field])
        check = item["reconciliation"]
        allow_keys(check, ("passed", "unexplainedDifferenceFen", "note"), "账单核对结果")
        amount(check.get("unexplainedDifferenceFen"))
        if check["passed"] is False and not check.get("note"):
            raise ValueError("账单未核对平衡时必须说明待确认内容")
    summary = data["paidSubtotal"]
    allow_keys(summary, (*SUMMARY_AMOUNTS, "itemCount", "unexplainedDifferenceFen", "scope", "note"), "已支付清单汇总")
    for key, value in subtotal(data["items"]).items():
        if summary.get(key) != value:
            raise ValueError(f"已支付清单汇总 {key} 与逐笔金额不一致")
    text = json.dumps(data, ensure_ascii=False)
    if re.search(r"private[/\\]|/Users/|file://|\b[0-9a-f]{32,64}\b|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[\dXx](?!\d)|\.(?:png|jpe?g|pdf)\b", text):
        raise ValueError("费用摘要含疑似身份号码、原始文件名或私密路径")


def convert(source):
    items = []
    for original in source["items"]:
        check = original["reconciliation"]
        items.append({
            "id": original["id"],
            **{key: original.get(key) for key in ITEM_TEXT},
            **{key: amount(original.get(key)) for key in AMOUNTS},
            "detailRead": original.get("detailRead") is True,
            "facts": strings(original.get("facts")),
            "reconciliation": {
                "passed": check.get("passed") is True,
                "unexplainedDifferenceFen": amount(check.get("unexplainedDifferenceFen")),
                "note": check.get("note") if isinstance(check.get("note"), str) else None,
            },
        })
    coverage = source["coverage"]
    observed = source["observedOn"]
    summary = subtotal(items)
    recorded_summary = source.get("observedPaidListSubtotal", {})
    for key, value in summary.items():
        if recorded_summary.get(key) != value:
            raise ValueError(f"原转录汇总 {key} 与逐笔费用不一致，停止生成")
    data = {
        "updatedAt": observed,
        "source": "安琪儿医院小程序的费用列表、账单详情和支付明细",
        "currency": "CNY", "amountUnit": "分",
        "coverage": {
            **{key: coverage.get(key) is True for key in ("paidListComplete", "pendingListComplete", "currentVisibleListComplete", "feeDateFilterAvailable")},
            "note": coverage["note"],
        },
        "accountBalance": {
            "label": "储值余额", "amountFen": amount(source["accountBalance"]["amountFen"]),
            "observedOn": observed, "note": source["accountBalance"]["note"],
        },
        "items": sorted(items, key=lambda item: (item["visitTime"], item.get("paymentTime") or "", item["id"]), reverse=True),
        "paidSubtotal": {**summary, "scope": recorded_summary["scope"], "note": recorded_summary["note"]},
        "unconfirmed": strings(source.get("unconfirmed")),
    }
    validate_public_expenses(data)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    data = convert(json.loads(args.source.read_text(encoding="utf-8")))
    (ROOT / "data/angel-expenses.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"已生成 {len(data['items'])} 笔匿名费用摘要，其中 {data['paidSubtotal']['itemCount']} 笔在已支付清单。")


if __name__ == "__main__":
    main()
