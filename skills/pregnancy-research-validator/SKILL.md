---
name: pregnancy-research-validator
description: Use when answering or maintaining pregnancy, prenatal care, childbirth, postpartum, newborn care, food, medicine, policy, hospital process, or Xi'an-local parenting information.
---

# Pregnancy Research Validator

## Core Rule

Search before answering. Pregnancy and newborn guidance is medical, policy-sensitive, and local-process-sensitive; do not rely on memory when a current source can be checked.

Always write user-facing documents, code comments, and git messages in Chinese unless the user asks otherwise. Read and write text as UTF-8.

## Source Priority

Use the strongest available sources first:

1. 中国国家卫健委、地方卫健委、政府服务网、社区卫生服务中心、目标医院官方页面。
2. WHO, CDC, ACOG, NHS, FDA, NICE, RCOG, and equivalent public-health or professional bodies.
3. Peer-reviewed guidelines or major hospital patient education pages.
4. Parent experience posts only for process hints, queueing, materials, practical pitfalls, and questions to verify. Never treat experience posts as medical authority.

For Xi'an-specific items, always run local searches such as:

- `西安 孕妇 建档 母子健康手册 办理 材料`
- `西安 <区县> 社区卫生服务中心 孕妇 建册`
- `西安 <医院名> 产科 建档 NT 预约`
- `西安 生育保险 产检 报销 2026`
- `西安 出生医学证明 办理 新生儿 户口 疫苗`

If the user's district, target hospital, insurance status, or hukou/residence situation is unknown, mark the item as local-policy pending and ask only when needed.

## Research Workflow

1. Clarify the question type: medical guidance, checkup schedule, local procedure, preparation list, risk warning, or experience/pitfall search.
2. Search at least two independent sources for medical or policy claims. For unstable local procedures, prefer official/current pages and verify dates.
3. Compare sources. If they disagree, state the disagreement and prefer the more official or more recent source.
4. Summarize in practical language:
   - `结论`
   - `适用范围`
   - `现在要做什么`
   - `什么时候问医生/医院`
   - `来源`
5. Add useful "认知补充": explain what the user may not know to ask, especially deadlines, appointment scarcity, required materials, and consequences of missing windows.

## Citation Rules

- Include source links in user-facing answers and knowledge files.
- Record source title, organization, URL, access date, and publication/update date when visible.
- Never quote long copyrighted text. Paraphrase and cite.
- Mark old, unclear, forum-only, or location-mismatched information as `仅供线索，需核实`.

## Medical Boundaries

- Do not provide a diagnosis or replace clinician care.
- For medication, supplement dose, abnormal labs, bleeding, pain, fever, severe vomiting, hypertension symptoms, diabetes concerns, fetal movement concerns, or emergency symptoms, provide safety framing and ask the user to contact a clinician.
- For food and lifestyle questions, distinguish "avoid", "limit", "generally okay if properly handled", and "ask doctor because of personal condition".

## Output For Knowledge Files

Use this structure for researched content:

```markdown
---
title:
category:
last_reviewed: YYYY-MM-DD
locality: 全国/陕西/西安/医院待确认
confidence: 高/中/低
---

## 简明结论

## 对我们现在的影响

## 需要提前做的事

## 可能的坑

## 需要问医生或医院

## 来源
```

## Default Xi'an Bias

The family is in Xi'an unless the project says otherwise. For any process involving appointments, maternal-child handbook, filing/building records, insurance, birth certificate, hukou, vaccination, confinement services, or hospital admission, supplement national guidance with Xi'an-local searches.
