import { globSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import type { Plugin } from 'vite';
import { locales } from '../src/i18n/locales.ts';
import { availableFrameworks, frameworks, validateFrameworkLocales } from '../src/lib/frameworks.ts';

// React pages compile through the content collection; every other framework compiles each page once more
const others = frameworks.filter((framework) => framework !== 'react');
const manifest = (framework: string) => `virtual:semi-${framework}-docs`;
const suffix = (framework: string) => `.${framework}.mdx`;
const query = (framework: string) => `?framework=${framework}`;

export default function frameworkMdx(): Plugin {
    let root = '';
    return {
        name: 'semi:framework-mdx',
        enforce: 'pre',
        configResolved(config) {
            root = config.root;
        },
        async resolveId(source, importer) {
            if (others.some((framework) => source === manifest(framework))) return '\0' + source;
            const target = others.find((framework) => source.endsWith('.mdx' + query(framework)));
            if (!target) return;
            const resolved = await this.resolve(source.slice(0, -query(target).length), importer, {
                skipSelf: true,
            });
            if (!resolved) throw new Error(`Cannot resolve ${target} document ${source}`);
            return resolved.id + suffix(target);
        },
        async load(id) {
            const listed = others.find((framework) => id === '\0' + manifest(framework));
            if (listed) {
                const entries: string[] = [];
                const availability = new Map<string, string>();
                this.addWatchFile(path.resolve(root, 'content'));
                for (const file of globSync('content/**/index.*.mdx', { cwd: root })) {
                    const source = path.resolve(root, file);
                    const directory = path.dirname(source);
                    this.addWatchFile(source);
                    this.addWatchFile(directory);
                    const demos = [...globSync('demos/*.{react.tsx,vue,solid.tsx}', { cwd: directory })];
                    const data = parseFrontmatter(await fs.readFile(source, 'utf8')).frontmatter;
                    const enabled = availableFrameworks(demos, data.frameworks, file);
                    const key = file.slice('content/'.length, -'.mdx'.length);
                    availability.set(key, enabled.join(','));
                    if (enabled.includes(listed)) {
                        entries.push(`${JSON.stringify(key)}: () => import(${JSON.stringify(source + query(listed))})`);
                    }
                }
                validateFrameworkLocales(availability, locales);
                return `export default {${entries.join(',')}};`;
            }
            const target = others.find((framework) => id.endsWith('.mdx' + suffix(framework)));
            if (!target) return;
            const source = id.slice(0, -suffix(target).length);
            this.addWatchFile(source);
            return fs.readFile(source, 'utf8');
        },
        configureServer(server) {
            const changed = (_event: string, file: string) => {
                if (!file.startsWith(path.resolve(root, 'content') + path.sep) || (!file.endsWith('.mdx') && !file.includes(path.sep + 'demos' + path.sep))) return;
                const directory = file.includes(path.sep + 'demos' + path.sep) ? file.slice(0, file.indexOf(path.sep + 'demos' + path.sep)) : path.dirname(file);
                const documents = locales.flatMap((locale) => {
                    const source = path.join(directory, `index.${locale}.mdx`);
                    return [source, ...others.map((framework) => source + suffix(framework))];
                });
                for (const environment of Object.values(server.environments)) {
                    for (const id of [...others.map((framework) => '\0' + manifest(framework)), ...documents]) {
                        const module = environment.moduleGraph.getModuleById(id);
                        if (module) environment.moduleGraph.invalidateModule(module);
                    }
                }
                server.ws.send({ type: 'full-reload' });
            };
            server.watcher.on('all', changed);
            server.httpServer?.once('close', () => server.watcher.off('all', changed));
        },
    };
}
