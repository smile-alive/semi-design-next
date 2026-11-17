import { mapValues } from 'es-toolkit';
import { optimize, type CustomPlugin, type PluginConfig, type XastElement } from 'svgo';
import type { IconData, IconNode } from '../../packages/shared/semi-icons-core/src/types.ts';

const isElement = (node: { type: string }): node is XastElement => node.type === 'element';

function toValue(value: string) {
    return Number.isNaN(Number(value) - parseFloat(value)) ? value : String(Number(value));
}

function toNode(element: XastElement): IconNode {
    const attrs = mapValues(element.attributes, toValue);
    const children = element.children.filter(isElement).map(toNode);
    return children.length ? [element.name, attrs, children] : [element.name, attrs];
}

// Highest `{fillN}` index plus one, not the number of placeholders
const countFills = (svg: string) => Math.max(0, ...svg.matchAll(/\{fill(\d)\}/g).map(([, index]) => Number(index) + 1));

export function svgToIconData(name: string, svg: string, plugins: PluginConfig[]): IconData {
    let root: XastElement | undefined;
    const capture: CustomPlugin = {
        name: 'captureTree',
        fn: (tree) => {
            root = tree.children.find(isElement);
        },
    };
    optimize(svg, { plugins: [...plugins, capture] });
    if (root?.name !== 'svg') throw new Error(`${name}.svg has no root svg element`);
    const [, attrs, children = []] = toNode(root);
    const fills = countFills(svg);
    return fills ? { name, attrs, children, fills } : { name, attrs, children };
}
