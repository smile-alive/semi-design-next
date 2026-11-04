# semi-website

[简体中文](README.zh-CN.md)

The docs site of Semi Design Next, built on Astro 7, with documentation and demos in Chinese and English for the component libraries of each framework. It is a private workspace package that is not published, and it also hosts the page scan and API table generation scripts.

## Running

Commands at the repository root (details in [CONTRIBUTING.md](../CONTRIBUTING.md#常用命令)):

```sh
pnpm site:dev        # start the dev server in the background, http://127.0.0.1:4321
pnpm site:build      # production build, output in website/dist
pnpm site:preview    # preview the production build in the background, http://127.0.0.1:4322, requires site:build
pnpm site:serve      # site:build plus site:preview
pnpm site:stop       # stop the dev server and preview
```

In a new checkout, first run `pnpm exec astro sync` under `website` to generate types (`website/.astro` is not committed).

## Directories

| Path              | Contents                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `content/`        | Doc pages, organized as `<category>/<page>/index.<locale>.mdx`, with `zh-CN` and `en-US` as locales                            |
| `src/`            | Pages, layouts, components and styles. `content.config.ts` validates frontmatter, and `lib/docs.ts` defines the category order |
| `plugins/`        | Markdown pipeline plugins: `remark-demo`, `framework-mdx`, `rehype-anchor-ids` and `rehype-table-container`                    |
| `scripts/`        | Page checks, API table generation, MDX table checks, React Compiler checks and layout comparison                               |
| `astro.config.ts` | i18n, the Markdown pipeline, framework and `mdx` integrations, and aliases that read each UI package's source directly         |

Page paths are `/{locale}/{framework}/{category}/{page}`, where the framework is the framework name in the package name (such as `react`). A page generates routes only for the frameworks that have demos.

## Writing docs

- Write examples as `<Demo id="types" />`. The build imports only the demo file for the current framework (such as `demos/<id>.react.tsx`; see `.agents/references/<framework>/website.md` for each framework's file names). Demo UI text is written in Chinese.
- Use `<Framework only="<framework>">` for framework-specific content.
- API tables for each framework are generated from component types by `pnpm --filter semi-website gen:<framework>-api`, and only that command updates them. `--check` validates them.
- The docs site compiles with React Compiler; library builds do not.

For MDX conventions, categories and demos, see [website](../.agents/references/website.md). For style rules, see [styles](../.agents/references/styles.md).

## Checks

```sh
pnpm lint:docs                                                    # table column counts and MDX compilation
pnpm site:build && pnpm site:dev
pnpm --filter semi-website check:pages http://127.0.0.1:4321      # console errors, empty demos, axe violations
```

`check:pages` accepts path filters, such as `/show/table`. On a full run, add `--update-a11y-baseline` to rewrite `scripts/a11y-baseline.json`; with a path filter it reports an error. For the process, see [check-pages](../.agents/skills/check-pages/SKILL.md).

`scripts/compare-layout.ts` compares the layout of two builds, for CSS changes that should not move any element: `node scripts/compare-layout.ts <baselineUrl> <candidateUrl> <path>... [--mode=ltr|rtl|both]`.

## Related packages

Depends on all UI-related packages: the UI and AI packages of each framework, `@fibrae/semi-ai-foundation`, `@fibrae/semi-foundation`, and the icon and illustration packages of each framework. The docs site does not use `@fibrae/semi-vite-plugin`.
