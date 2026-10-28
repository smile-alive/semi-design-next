import { optimize, type CustomPlugin, type PluginConfig, type XastElement } from 'svgo';
import type { IconData, IconNode } from '../packages/semi-icons-core/src/types.ts';

function toValue(value: string) {
    return Number.isNaN(Number(value) - parseFloat(value)) ? value : String(Number(value));
}

function toNode(element: XastElement): IconNode {
    const attrs = Object.fromEntries(Object.entries(element.attributes).map(([name, value]) => [name, toValue(value)]));
    const children = element.children.filter((child): child is XastElement => child.type === 'element').map(toNode);
    return children.length ? [element.name, attrs, children] : [element.name, attrs];
}

export function svgToIconData(name: string, svg: string, plugins: PluginConfig[]): IconData {
    let root: XastElement | undefined;
    const capture: CustomPlugin = {
        name: 'captureTree',
        fn: (tree) => {
            root = tree.children.find((child): child is XastElement => child.type === 'element');
        },
    };
    optimize(svg, { plugins: [...plugins, capture] });
    if (root?.name !== 'svg') throw new Error(`${name}.svg has no root svg element`);
    const [, attrs, children = []] = toNode(root);
    const fills = Math.max(0, ...[...svg.matchAll(/\{fill(\d)\}/g)].map(([, index]) => Number(index) + 1));
    return fills ? { name, attrs, children, fills } : { name, attrs, children };
}
