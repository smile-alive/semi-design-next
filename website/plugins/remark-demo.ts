import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import type { Program } from 'estree';
import type { Parent, Root } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { demoHydration, frameworkDemo, frameworks, type Framework } from '../src/lib/frameworks.ts';

function estree(code: string) {
    return parse(code, { ecmaVersion: 'latest', sourceType: 'module' }) as unknown as Program;
}

export function filterFrameworks(parent: Parent, target: Framework, location: string) {
    parent.children = parent.children.flatMap((node) => {
        if (node.type === 'mdxJsxFlowElement' && node.name === 'Framework') {
            const only = node.attributes.find((attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'only');
            if (typeof only?.value !== 'string' || !frameworks.includes(only.value as Framework)) {
                throw new Error(`${location}: <Framework> needs ${frameworks.map((framework) => `only="${framework}"`).join(' or ')}`);
            }
            if (only.value !== target) return [];
            filterFrameworks(node, target, location);
            return node.children;
        }
        if ('children' in node) filterFrameworks(node, target, location);
        return [node];
    });
}

const contentRoot = path.resolve(import.meta.dirname, '../content');

export default function remarkDemo({ hydration = demoHydration }: { hydration?: typeof demoHydration } = {}) {
    for (const framework of frameworks) {
        for (const page of hydration[framework].except) {
            if (!fs.existsSync(path.join(contentRoot, page))) {
                throw new Error(`demoHydration.${framework}.except: page "${page}" not found under website/content`);
            }
        }
    }
    return (tree: Root, file: VFile) => {
        // framework-mdx compiles a page once more per other framework, as `<page>.mdx.<framework>.mdx`
        const target = frameworks.find((framework) => framework !== 'react' && file.path.endsWith(`.mdx.${framework}.mdx`)) ?? 'react';
        filterFrameworks(tree, target, file.path);
        const docDir = path.dirname(file.path);
        const page = path.relative(contentRoot, docDir);
        const { mode, except } = hydration[target];
        const clientOnly = (mode === 'only') !== except.includes(page);
        const imports: string[] = [];
        let demoIndex = 0;
        visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
            if (node.name !== 'Demo') return;
            const idAttr = node.attributes.find((attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'id');
            const id = typeof idAttr?.value === 'string' ? idAttr.value : undefined;
            if (!id) throw new Error(`${file.path}: <Demo> needs a string id`);
            const demoFile = `${id}.${frameworkDemo[target].extension}`;
            if (!fs.existsSync(path.join(docDir, 'demos', demoFile))) {
                throw new Error(`${file.path}: demo "${id}" not found, looked for demos/${demoFile}`);
            }
            const local = `Demo${demoIndex++}`;
            imports.push(`import ${local} from './demos/${demoFile}';`, `import ${local}Source from './demos/${demoFile}?raw';`);
            const sourceExpression = `${local}Source`;
            node.attributes.push(
                { type: 'mdxJsxAttribute', name: 'framework', value: target },
                {
                    type: 'mdxJsxAttribute',
                    name: 'source',
                    value: {
                        type: 'mdxJsxAttributeValueExpression',
                        value: sourceExpression,
                        data: { estree: estree(sourceExpression) },
                    },
                }
            );
            node.children = [
                {
                    type: 'mdxJsxFlowElement',
                    name: local,
                    attributes: [clientOnly ? { type: 'mdxJsxAttribute', name: 'client:only', value: frameworkDemo[target].clientOnly } : { type: 'mdxJsxAttribute', name: 'client:visible', value: null }],
                    children: [],
                },
            ];
        });
        if (imports.length) {
            const code = imports.join('\n');
            tree.children.unshift({ type: 'mdxjsEsm', value: code, data: { estree: estree(code) } } satisfies MdxjsEsm);
        }
    };
}
