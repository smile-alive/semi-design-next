---
name: check-pages
description: 在文档站扫描控制台报错、空 demo、axe 违规和焦点环，并维护 a11y 基线。触发：扫描页面、check-pages、axe、a11y 基线、demo 报错、页面检查、新增违规、基线更新。
---

# 文档站页面扫描

`website/scripts/check-pages.ts` 逐页打开文档站：收集浏览器报错，检查每个 demo 是否渲染出内容，对每个 demo 跑 axe，再和 `website/scripts/a11y-baseline.json` 对比；最后在每个 demo 里逐个 Tab，检查 Semi 元素的键盘焦点环。命令都在 `website/` 目录下执行，先按 `AGENTS.md` 设置 PATH。

## 准备

1. 页面清单来自 `website/dist` 里的 `index.html`，而不是 dev server。dist 不存在，或者页面有增删时，先在根目录跑 `pnpm --filter semi-website build`。
2. 一律扫描 dev server：生产构建不输出重复 key、未知 DOM 属性、非法嵌套、hydration 不匹配等开发期警告。并行会话共用一台机器，dev server 在后台用本检出专属的端口启动，check-pages 显式传该地址。不用写死端口的 `pnpm site:dev`、`site:preview`、`site:stop`（`site:stop` 会停掉别人的服务）。结束时只停自己启动的进程。
3. 锁文件或依赖导入方式变化后，先 `trash website/node_modules/.vite` 再启动，否则会大量报「Failed to fetch dynamically imported module」。
4. 不要在 `pnpm build` 运行时扫描，也不要在扫描期间修改网站文件：dev server 重新处理依赖或整页刷新，都会让扫描超时或崩溃。

## 运行

```bash
pnpm --filter semi-website exec astro dev --port <本检出的端口> --host 127.0.0.1
node scripts/check-pages.ts http://127.0.0.1:<本检出的端口> /<框架>/
```

- 第二个参数是路径片段，按子串过滤页面。只扫改动涉及的组件页和主要使用方页面；全站扫描在一批改动合入后跑一次。
- 冷启动后的头几个页面可能超时，单独重扫确认即可。

## SSR 验收

1. 按「准备」「运行」对 dev server 按 `/<框架>/` 扫描。生产预览不能用来判断 hydration：生产构建会静默保留服务端与客户端的差异。控制台里含 `hydrat` 的 warning 与 error 都计为失败（Vue 的不匹配是 warning）。
2. check-pages 不与浏览器测试同时跑。
3. 脚本把每个 demo 依次滚入视口，停在原处等该岛完成 hydration（每个 demo 最多 15 秒）再滚下一个。Astro 在 hydration 结束后移除 `astro-island` 的 `ssr` 属性，`client:only` 岛同样。扫描页面的 HMR 连接被替换为空连接，修改文件后立即扫描也不会被 Vite 整页刷新打断。
4. 扫描页面的 `Date` 比服务端快 400 天 7 小时 13 分（只改 `Date`，不动计时器）。首帧渲染当前时间的 demo 因此在 dev 中也报 hydration 不匹配；静态站点在构建当天渲染、在之后某天注水，同样会不匹配。修法是 demo 用固定日期（日历类传 `displayValue`），或把当前时间放到挂载后计算。

## 读结果

输出是一个 JSON，有任一失败时退出码为 1：

| 字段 | 含义 | 处理 |
| --- | --- | --- |
| `failures[].errors` | 页面的浏览器报错，以及 demo 预览区里重复的 id（`duplicate id in demos`，axe 按 demo 分别扫描看不到） | 修代码或 demo |
| `failures[].emptyDemos` | 没有渲染出内容的 demo，包括超时仍未完成 hydration（`astro-island` 一直带着 `ssr` 属性）的 demo | 修 demo 或组件 |
| `newA11yViolations` | 基线里没有的 axe 违规。CodeHighlight 等用 Shiki 渲染的代码（`.shiki` 内）的 color-contrast 不计入：语法配色来自 Shiki 主题，维护者决定不处理 | 修组件或 demo。确认无法修、需要接受时，先问维护者，再加入基线 |
| `fixedA11yViolationsStillInBaseline` | 已经不再出现、但还在基线里的违规 | 从基线里删掉 |
| `userAgentFocusRings` | 从示例预览区逐个 Tab，键盘聚焦时显示浏览器默认 `auto` 焦点环的 Semi 元素（`标签.类名`） | 在组件样式的 `:focus-visible` 里 `@include focus-ring`，见 [a11y](../../references/a11y.md)。没有基线，出现即失败。焦点时打开、渲染到 body 的弹层内的元素不在检查范围内 |

## 维护基线

- 基线的键是 `<页面路径>#demo-<id>`，值是排好序的 axe 规则 id 列表。删掉已修复的条目是收紧，可以直接做；新增条目是放宽，需要维护者同意。
- 框架 key 没有独立条目时的回退规则见该框架的 `website.md`；超出回退基线的违规仍失败。全量更新写入前按同一规则校验，不通过则拒绝写入。
- `--update-a11y-baseline` 要求全站运行且没有失败页面，它会同时写入新增违规，等于放宽，只在维护者同意后使用。日常收紧用编辑工具手工修改：只改本次扫描结果涉及的键，保持键名和规则列表的排序。
- 改完基线后，对涉及的页面重扫一次，确认没有 `newA11yViolations` 和 `fixedA11yViolationsStillInBaseline`。

## 报告

```text
范围：<路径片段或全站>
页面 N  demo M  带违规的 demo K
失败：<逐页列出 errors / emptyDemos，或 无>
新增违规：<demo、规则、处理方式>
已修复移出基线：<demo、规则>
结论：PASS / FAIL
```
