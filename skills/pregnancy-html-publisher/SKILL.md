---
name: pregnancy-html-publisher
description: Use when creating, updating, testing, or deploying Cloudflare-friendly static HTML pages for a pregnancy timeline, reminders, reports, knowledge cards, images, and family viewing.
---

# Pregnancy HTML Publisher

## Core Rule

Generate a static, easy-to-read pregnancy dashboard where family can immediately see current gestational age, upcoming reminders, records, knowledge, and photos. The page should be suitable for Cloudflare static hosting and include a lightweight password gate.

Always write user-facing documents, code comments, and git messages in Chinese unless the user asks otherwise. Read and write text as UTF-8.

## Privacy Model

- Audience: parents and a small number of family members.
- Do not automatically redact names, hospitals, or report images unless the user asks.
- Include a lightweight client-side password gate. Store successful verification in `localStorage` so the same browser does not ask again.
- Warn when highly sensitive raw reports are published. Static client-side password protection is convenience protection, not strong security.
- If stronger protection is requested, recommend Cloudflare Access or a server-side gate.

## Page Requirements

The first screen should show:

- Current pregnancy week and day.
- Estimated due date and dating basis.
- Next 3 to 5 important reminders with red/yellow/green urgency.
- Latest report/checkup summary.
- Quick links to timeline, reports, knowledge, preparation list, and journal.

Core pages or sections:

- `首页`: dashboard and reminders.
- `时间线`: dated pregnancy events, checkups, milestones, and family notes.
- `检查记录`: lab reports, ultrasound records, prescriptions, images, and doctor instructions.
- `待办提醒`: process deadlines, prep items, local verification status.
- `知识库`: source-backed explainers with "需要问医生" sections.
- `交流记录`: summarized family/Codex discussions, decisions, researched conclusions, and next actions.
- `准备清单`: documents, hospital bag, home preparation, newborn items.
- `日记相册`: family memories.

## Build Workflow

1. Read structured data and content from the project.
2. Validate required fields: pregnancy dating, tasks, reports, sources.
3. Render static assets into `site/` or the existing output directory.
4. Ensure all reminders have visible urgency, due dates, and reasons.
5. Ensure source-backed knowledge shows source links and review date.
6. Test locally if a server or browser workflow exists.
7. Provide the local preview path or URL and Cloudflare deployment notes.

## Design Guidance

- Use a calm, practical family-dashboard style rather than a marketing landing page.
- Prioritize scanability on mobile: current week, next deadline, and latest update must be visible quickly.
- Use stable card sizes and responsive layout so long Chinese text does not overflow.
- Avoid huge decorative hero sections. This is a tool the family will check repeatedly.
- Use simple icons where available, but do not let visual polish hide missing medical sources or deadlines.
- Use the approved V5 `淡暖阅读版` visual style unless the user explicitly changes direction:
  - Page background: very light warm white / rice-apricot, such as `#fffaf3`, `#fff2e5`, `#fdebdc`.
  - Accent colors: low-saturation shallow apricot for warmth, deep brown for text, small-area pale teal/green for health and trust.
  - Cards: warm paper texture, translucent warm-white surfaces, light borders, soft rounded corners around 20-30px, and gentle shadows.
  - Avoid: large pure-white fields, heavy terracotta/orange backgrounds, high-saturation pink/purple gradients, dark dashboards, strong shadows, dense decorative elements, and any palette that reduces readability.
  - Reading priority: body text contrast and scanability outrank warmth; if a warm color makes content harder to read, lighten the color and keep text dark.

## Password Gate Pattern

Use a simple static pattern when the project has no backend:

- Keep a password hash or configurable password in site config, not scattered through files.
- On load, check `localStorage`.
- If not verified, show a full-page password prompt.
- After success, set a versioned key such as `pregnancy_access_v1=true`.
- Include a visible logout/reset control for shared devices.

Do not present this as strong security. It only discourages casual viewing.

## HTML Data Contract

The publisher should be able to render these concepts even if filenames differ:

- pregnancy profile: LMP, due date, dating basis, current gestational age.
- tasks: title, category, status, dates, urgency, prep items, pitfalls, sources.
- reports: date, type, facts, doctor conclusions, images, questions.
- knowledge: title, category, summary, local status, sources, last reviewed.
- conversations: date, title, tags, background, decisions, next actions, related records.
- journal: date, tags, text, optional images.

If a field is missing, render a gentle "待补充" state and create or update a task rather than silently omitting important gaps.
