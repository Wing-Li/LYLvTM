# 宝宝成长档案

这是一个用于记录孕期、生产、产后和孩子早期成长过程的家庭项目。

## 当前状态

- 末次月经：2026-04-30
- 粗算预产期：2027-02-04
- 首次血检确认：2026-05-24
- 首页：`site/index.html`
- 知识库：`site/knowledge.html`
- 待办提醒：`site/tasks.html`
- 来源总表：`site/sources.html`
- 血检详情：`site/reports/2026-05-24-blood-test.html`
- 交流记录：`site/conversations.html`
- 默认访问密码：`lyltm`

## 本地预览

可以直接打开 `site/index.html`，也可以启动静态服务后访问：

```powershell
cd D:\projecs\me\LYLvTM\site
python -m http.server 4173
```

然后打开：

```text
http://localhost:4173
```

## Cloudflare 部署

部署静态站点时，发布目录使用：

```text
site
```

报告图片已经复制到 `site/assets/images/`，因此只部署 `site/` 目录也能显示。

## 页面结构

首页只保留摘要和入口。报告、交流记录、知识库、待办和来源都使用二级页面展示，后续内容增加时继续按这个结构扩展。

二级页面入口：

- `site/knowledge.html`：孕早期注意事项。
- `site/tasks.html`：完整待办和孕周窗口。
- `site/sources.html`：来源总表和外部链接。
- `site/reports/2026-05-24-blood-test.html`：血检详情和报告原图。
- `site/conversations.html`：交流记录入口。
- `site/conversations/2026-05-24-project-and-ui-design.html`：项目规划与视觉方向。
- `site/conversations/2026-05-25-xian-yanta-pregnancy-benefits.html`：西安雁塔区孕期补贴和福利。

## 后续优先补充

- 雁塔区具体居住街道和对应社区卫生服务中心。
- 目标产检/生产医院。
- 医生是否建议复查 β-HCG / 孕酮。
- 早孕 B 超建议时间。
- 雁塔区建册/母子健康手册办理材料和流程。
