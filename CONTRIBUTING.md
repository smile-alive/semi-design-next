# 参与贡献

感谢你愿意改进 Semi Design Next。提交 issue 或 PR 前，请先读完本文。

## 提问与反馈

- 缺陷：使用 [Bug 报告](https://github.com/smile-alive/semi-design-next/issues/new?template=bug-report.yml) 模板，附上可复现的最小示例、框架与浏览器版本。
- 新功能：先开 [功能建议](https://github.com/smile-alive/semi-design-next/issues/new?template=feature-request.yml) 讨论，确认方向后再写代码。
- 安全问题：不要公开提 issue，按 [SECURITY.md](SECURITY.md) 私下报告。

本项目是 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，不合并回上游。上游的问题请到上游仓库反馈。

## 开发环境

Node 与 pnpm 的版本由 [mise](https://mise.jdx.dev) 按 `mise.toml` 安装：

```bash
mise install
pnpm install
pnpm build
pnpm site:dev
```

目录结构与常用命令见 [README.md](README.md)。写法规则在 [AGENTS.md](AGENTS.md) 与 `.agents/references/`，人和编码 agent 共用同一套规则；改哪个框架的包，先读该框架目录下的全部规则。

## 提交 PR

1. 从 `main` 新建分支，一个 PR 只做一件事。
2. 组件逻辑放 `packages/semi-foundation`，React、Vue、Solid 三个框架的包同步修改。
3. 修 bug 先写一条在当前代码上会失败的用例；测试断言可见行为。
4. 行为或公开 API 有变化时：
    - 更新 `docs/release-notes.md` 对应组件的章节；
    - 文档页的中英文同步修改；
    - 运行 `pnpm changeset` 添加变更说明。
5. 提交前运行：

    ```bash
    pnpm check
    ```

    改动布局、焦点或指针行为时，再跑该组件的浏览器测试：

    ```bash
    vp test run --project react-browser packages/semi-ui-react/src/<组件>
    ```

6. commit 使用 [Conventional Commits](https://www.conventionalcommits.org/)，`type(scope)` 用英文，scope 写包名或组件目录名，subject 中英文均可，header 不超过 72 个字符。

CI 在每个 PR 上运行 `pnpm check` 与类型检查；Chromium、Firefox、WebKit 三个浏览器的完整测试每天定时运行。

## 许可

提交贡献即表示你同意以 [MIT 许可](LICENSE) 发布你的代码。
