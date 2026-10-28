# Changesets

改动了发布包的行为或公开 API 时，在 PR 里运行 `pnpm changeset` 添加一条变更说明。所有 `@fibrae/*` 包使用同一个版本号一起发布。

合入 `main` 后，Release 工作流会开一个「Version Packages」PR，汇总版本号和 CHANGELOG；合入这个 PR 即发布到 npm。
