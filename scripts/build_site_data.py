"""校验结构化资料并生成静态站点使用的数据，无需安装依赖。"""

import json
import hashlib
import re
from datetime import date
from pathlib import Path

from import_angel_records import validate_public_records
from import_angel_expenses import validate_public_expenses

ROOT = Path(__file__).resolve().parents[1]
NAMES = ("pregnancy", "tasks", "sources", "reports", "conversations")


def build():
    data = {
        name: json.loads((ROOT / "data" / f"{name}.json").read_text(encoding="utf-8"))
        for name in NAMES
    }
    data["angelRecords"] = json.loads((ROOT / "data" / "angel-records.json").read_text(encoding="utf-8"))
    validate_public_records(data["angelRecords"])
    data["angelExpenses"] = json.loads((ROOT / "data" / "angel-expenses.json").read_text(encoding="utf-8"))
    validate_public_expenses(data["angelExpenses"])
    for name in NAMES[1:]:
        ids = [row["id"] for row in data[name]]
        if len(ids) != len(set(ids)):
            raise ValueError(f"{name} 中存在重复 ID")
    for key in ("lastMenstrualPeriod", "estimatedDueDate"):
        date.fromisoformat(data["pregnancy"][key])
    source_ids = {row["id"] for row in data["sources"]}
    for task in data["tasks"]:
        for key in ("idealStartDate", "remindFromDate", "latestDate", "reviewByDate"):
            if task.get(key):
                date.fromisoformat(task[key])
        if task.get("latestDate") and task["idealStartDate"] > task["latestDate"]:
            raise ValueError(f"{task['id']} 日期顺序错误")
        for source in task["sources"]:
            if source not in source_ids:
                raise ValueError(f"{task['id']} 缺少来源 {source}")
    for report in data["reports"]:
        # 本地原件可供核对，但不进入浏览器数据；其他设备可能没有私密原件。
        for image in report.pop("imagePaths", []):
            original = (ROOT / image).resolve()
            if not original.is_relative_to(ROOT):
                raise ValueError(f"{report['id']} 原件路径超出项目目录")
            if not original.is_file():
                if original.is_relative_to(ROOT / "private"):
                    print(f"本地未附原件：{report['id']}，仍可生成已核对的摘要。")
                else:
                    raise ValueError(f"缺少原始报告：{image}")
        for image in report.get("siteImagePaths", []):
            published = (ROOT / "site" / image).resolve()
            if not published.is_relative_to(ROOT / "site") or not published.is_file():
                raise ValueError(f"{report['id']} 公开图片必须是 site/ 内的现有文件")
    text = json.dumps(data, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    if "private/" in text or "private\\\\" in text:
        raise ValueError("站点数据仍含私密文件路径，请仅保留适合家人页面展示的摘要")
    target = ROOT / "site" / "assets" / "site-data.js"
    target.write_text("/* 由 scripts/build_site_data.py 生成，请修改 data/ 中的源文件。 */\nwindow.PREGNANCY_DATA = " + text + ";\n", encoding="utf-8")
    # 为所有页面的本地样式与脚本附加内容版本，避免发布后混用旧导航或旧数据。
    asset_pattern = re.compile(r'(src|href)="((?:\.\./)*assets/[^"?]+\.(?:js|css))(?:\?[^"\s]*)?"')
    for page in (ROOT / "site").rglob("*.html"):
        original = page.read_text(encoding="utf-8")

        def version_asset(match):
            asset = (page.parent / match.group(2)).resolve()
            if not asset.is_relative_to(ROOT / "site") or not asset.is_file():
                raise ValueError(f"页面资源不存在或超出发布目录：{page.name} / {match.group(2)}")
            version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
            return f'{match.group(1)}="{match.group(2)}?v={version}"'

        updated = asset_pattern.sub(version_asset, original)
        if updated != original:
            page.write_text(updated, encoding="utf-8")
    print(f"已生成站点数据：{len(data['tasks'])} 项提醒、{len(data['sources'])} 条来源、{len(data['angelRecords']['reports'])} 份安琪儿报告摘要、{len(data['angelExpenses']['items'])} 笔费用。")


if __name__ == "__main__":
    build()
