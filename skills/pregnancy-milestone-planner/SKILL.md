---
name: pregnancy-milestone-planner
description: Use when maintaining pregnancy week calculations, prenatal milestones, filing/building records, appointment windows, advance reminders, deadline risks, preparation lists, or HTML reminders.
---

# Pregnancy Milestone Planner

## Core Rule

Turn pregnancy into dated, visible, source-backed next steps. Every important process should have an ideal start date, latest safe window, advance reminder, preparation list, local verification status, and visible HTML reminder.

Always write user-facing documents, code comments, and git messages in Chinese unless the user asks otherwise. Read and write text as UTF-8.

## Dating Workflow

1. Read `data/pregnancy.json` or equivalent for:
   - last menstrual period
   - estimated due date
   - dating basis: LMP, ultrasound, or clinician-corrected
   - current date/timezone
2. If ultrasound or clinician changes gestational age or due date, update the dating basis and recalculate all future reminders.
3. Show uncertainty clearly: early estimates can change after ultrasound.
4. Use exact calendar dates in reminders, not only "next month" or "later".

## Reminder Fields

Each milestone/task should include:

```json
{
  "id": "milestone-short-name",
  "title": "",
  "category": "产检/建档/筛查/证件/用品/学习/风险",
  "status": "未开始/准备中/已预约/已完成/需核实/不适用",
  "gestationalWindow": "",
  "idealStartDate": "YYYY-MM-DD",
  "latestDate": "YYYY-MM-DD",
  "remindFromDate": "YYYY-MM-DD",
  "whyItMatters": "",
  "missedWindowImpact": "",
  "prepItems": [],
  "questionsToAsk": [],
  "localVerification": "全国通用/西安已核实/医院待核实/社区待核实",
  "sources": []
}
```

## Planning Workflow

1. Recompute current gestational age and due date.
2. Review milestones from now through at least the next 8 weeks.
3. Include strict-window checks such as early ultrasound, maternal-child handbook/filing, NT, early/mid-pregnancy screening, anatomy scan, glucose screening, later admission preparation, birth certificate, hukou, and vaccination.
4. For each upcoming item, search or use `pregnancy-research-validator` when medical or local-policy accuracy matters.
5. Add "pitfall" notes: appointment scarcity, missing local materials, wrong hospital/department, using an unqualified institution, missing screening windows, relying on one-size-fits-all advice, or forgetting to ask whether the due date was corrected.
6. Update `data/tasks.json` or equivalent and ensure the HTML publisher can display red/yellow/green urgency.

## Baseline Milestones To Maintain

Use these only as a checklist; verify details and local rules before finalizing dates:

- Pregnancy confirmation and follow-up blood tests if clinician recommends.
- Early ultrasound to confirm intrauterine pregnancy and dating, scheduled per clinician.
- Maternal-child handbook / filing / first prenatal visit before 13 weeks where applicable.
- NT screening window, commonly 11 weeks to 13 weeks + 6 days.
- Aneuploidy screening options such as serum screening or NIPT, including eligibility, timing, qualified institution, and consent.
- Anatomy scan / major anomaly screening in mid-pregnancy.
- Gestational diabetes screening, commonly around 24 to 28 weeks.
- Third-trimester checkups, fetal movement education, hospital admission bag, delivery hospital process.
- Postpartum 42-day visit, newborn birth certificate, hukou/social insurance, vaccination schedule.

## Urgency Display

Assign urgency for HTML:

- `red`: overdue, within 7 days of latest date, or symptom/emergency warning.
- `yellow`: remind window has started or appointment should be booked soon.
- `green`: future informational item.
- `gray`: completed or not applicable.

## Local Xi'an Rule

For filing, maternal-child handbook, target hospital rules, prenatal screening appointment, insurance reimbursement, birth certificate, hukou, and vaccination, require Xi'an-local verification. If district, community health center, or hospital is unknown, create a task to ask or verify it.
