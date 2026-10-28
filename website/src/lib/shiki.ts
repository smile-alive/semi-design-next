// 正文代码块（astro.config.ts 的 shikiConfig）与示例源码面板（Demo.astro）共用；只输出 CSS 变量，由 site.css 按当前模式选用
export const shikiThemes = { light: 'github-light', dark: 'github-dark' } as const;
