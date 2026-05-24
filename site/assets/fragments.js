function iconHeart() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" fill="currentColor"/></svg>';
}

function siteHeader(active = "") {
  const links = [
    ["首页", "index.html"],
    ["待办提醒", "tasks.html"],
    ["检查记录", "reports/2026-05-24-blood-test.html"],
    ["知识库", "knowledge.html"],
    ["交流记录", "conversations/2026-05-24-project-and-ui-design.html"],
    ["来源", "sources.html"]
  ];
  const prefix = document.body.dataset.depth === "1" ? "../" : "";
  document.write(`
    <header class="topbar">
      <a class="brand" href="${prefix}index.html">
        <span class="brand-mark">${iconHeart()}</span>
        <span>宝宝成长档案</span>
      </a>
      <nav class="nav" aria-label="页面导航">
        ${links.map(([label, href]) => `<a href="${prefix}${href}" ${label === active ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
        <button id="logoutButton" type="button">退出验证</button>
      </nav>
    </header>
  `);
}

function accessGate() {
  document.write(`
    <div class="access-gate" id="accessGate" aria-live="polite">
      <form class="gate-card" id="accessForm">
        <div class="gate-mark" aria-hidden="true">${iconHeart()}</div>
        <h1>宝宝成长档案</h1>
        <p>给我们和家人看的私密页面。默认密码可之后随时修改。</p>
        <div class="gate-row">
          <label class="sr-only" for="passwordInput">访问密码</label>
          <input class="gate-input" id="passwordInput" type="password" autocomplete="current-password" placeholder="输入访问密码">
          <button class="btn" type="submit">进入</button>
        </div>
        <div class="gate-error" id="gateError" role="alert">密码不对，再确认一下。</div>
      </form>
    </div>
  `);
}
