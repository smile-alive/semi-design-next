import { availableFrameworks, type Framework } from '#/lib/frameworks';

// Kept out of the .tsx: vite-plugin-solid sets the dep scanner's JSX to 'preserve', and Vite's scanner re-parses
// files containing import.meta.glob as plain JS, so JSX next to the glob fails the scan. Move it back once the
// scanner keeps the file's own module type for glob files or the Solid plugin stops forcing 'preserve'.

// English doc title -> page path; Chinese titles miss cards like "Button 按钮", so both locales use the English title.
// The glob lives in the function: the overview matches itself (circular); frontmatter initializes at render.
export function pathsByEnTitle() {
    const pages = import.meta.glob<{ title: string; frameworks?: Framework[] }>('/content/**/index.en-US.mdx', {
        eager: true,
        import: 'frontmatter',
    });
    const map: Record<string, string> = {};
    const available: string[] = [];
    const demos = Object.keys(import.meta.glob('/content/**/demos/*.{react.tsx,vue,solid.tsx,svelte}', { eager: true, query: '?raw', import: 'default' }));
    for (const [file, frontmatter] of Object.entries(pages)) {
        const [category, page] = file.split('/').slice(-3, -1);
        map[frontmatter.title] = `${category}/${page}`;
        const enabled = availableFrameworks(
            demos.filter((demo) => demo.startsWith(`/content/${category}/${page}/demos/`)),
            frontmatter.frameworks,
            file
        );
        for (const framework of enabled.filter((item) => item !== 'react')) {
            available.push(`/zh-CN/${framework}/${category}/${page}`, `/en-US/${framework}/${category}/${page}`);
        }
    }
    return { paths: map, available };
}
