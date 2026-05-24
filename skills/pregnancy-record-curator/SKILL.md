---
name: pregnancy-record-curator
description: Use when maintaining a pregnancy project with checkup reports, symptoms, medicines, doctor notes, family journal entries, images, timelines, or HTML-ready pregnancy records.
---

# Pregnancy Record Curator

## Core Rule

Maintain a trustworthy family pregnancy archive. Preserve facts exactly, separate medical claims from family notes, and update downstream reminders and HTML data whenever new pregnancy information arrives.

Always write user-facing documents, code comments, and git messages in Chinese unless the user asks otherwise. Read and write text as UTF-8.

## Intake Workflow

1. Identify the source type: lab report, ultrasound, prescription, doctor instruction, symptom note, family diary, purchase/preparation item, or policy/process note.
2. Extract only observable facts from source material. Include dates, hospital/department, gestational age used by the report, values, units, reference ranges, doctor names when visible, and image paths.
3. Store or update records using stable IDs. Do not overwrite old medical values when a newer value exists; append a new dated record.
4. Split content into four labels:
   - `事实记录`: directly observed or user-provided facts.
   - `医生结论`: explicit diagnosis, instruction, medication, or next step from a clinician.
   - `AI整理`: summaries, explanations, timelines, and organization produced by Codex.
   - `待确认问题`: anything that should be asked at the next appointment.
5. After any update, invoke or follow `pregnancy-milestone-planner` logic to check whether current and upcoming reminders changed.
6. If the change affects visible pages, invoke or follow `pregnancy-html-publisher` logic to regenerate the site.

## Conversation Summaries

When the user asks to preserve a discussion, or when a conversation creates durable value for future pregnancy decisions, create or update a concise conversation summary. Do not archive raw chat by default; summarize the useful record.

Good candidates:

- Decisions about hospitals, checkups, screening choices, privacy, deployment, or family process.
- Researched conclusions with sources and practical next steps.
- Questions prepared for a doctor or hospital.
- The family's concerns, preferences, and reasoning at that time.
- Project design decisions that explain why the HTML or data is organized a certain way.

Suggested location:

```text
content/
  conversations/
    YYYY-MM-DD-short-topic.md
```

Template:

```markdown
---
date: YYYY-MM-DD
type: conversation-summary
title:
tags: []
related:
  reports: []
  tasks: []
  knowledge: []
visibility: family
---

## 背景

## 这次讨论确定了什么

## 重要信息和来源

## 后续行动

## 仍需确认
```

Conversation summaries may be referenced by timeline events, tasks, knowledge cards, or report pages. If a summary changes reminders, run the milestone planner logic.

## Medical Safety

- Never diagnose, reassure, or interpret risk from a single value as final. Say when a result supports pregnancy, needs trend comparison, or requires ultrasound/doctor confirmation.
- For symptoms such as abdominal pain, bleeding, dizziness/fainting, shoulder pain, fever, severe vomiting, severe headache, vision change, swelling, or reduced fetal movement later in pregnancy, mark as urgent and advise contacting a clinician or emergency service.
- Do not recommend stopping, starting, or changing medicines or supplements without clinician confirmation.
- If the user asks "is this normal", "what should we do", "can she eat/use/take this", or similar, use `pregnancy-research-validator`.

## Suggested Project Data

Prefer simple structured files that can generate static HTML:

```text
data/
  pregnancy.json          # LMP, due date, dating basis, current status
  people.json             # family display names and roles
  reports.json            # dated lab/ultrasound/checkup records
  symptoms.json           # dated symptoms and severity
  doctor-notes.json       # doctor instructions and follow-up plans
  tasks.json              # actionable reminders
  sources.json            # cited medical/policy sources
content/
  journal/                # family diary entries
  knowledge/              # researched explainers
  conversations/          # summarized family/Codex discussions
  reports/                # markdown summaries of major reports
images/                   # original report photos and family images
site/                     # generated static HTML output
```

If the project already has a different structure, follow it and keep the same separation principles.

## Record Templates

Medical report entry:

```json
{
  "id": "report-YYYYMMDD-short-name",
  "date": "YYYY-MM-DD",
  "type": "血检/B超/产检/处方/其他",
  "gestationalAge": "按末次月经或医生校正",
  "institution": "",
  "imagePaths": [],
  "facts": [],
  "doctorConclusions": [],
  "aiSummary": "",
  "questionsForDoctor": []
}
```

Journal entry:

```markdown
---
date: YYYY-MM-DD
type: journal
tags: []
---

## 今天发生了什么

## 身体感受

## 我们想记住的事

## 下次要问医生
```

## Quality Checks

Before finishing:

- Confirm dates use `YYYY-MM-DD`.
- Confirm values keep original units.
- Confirm uncertain statements are marked as `待确认问题`.
- Confirm new facts did not erase prior history.
- Confirm reminders and HTML output were considered.
