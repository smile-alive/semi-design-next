import { For, createMemo, createUniqueId, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { IconData, IconNode } from '@fibrae/semi-icons-core';
import { defaultAttrs, getFillColor, resolveValue } from '@fibrae/semi-icons-core/utils';
import Icon from './icon';
import type { IconProps, SvgProps } from './interface';

type Resolve = (value: string) => string;

function resolveAttrs(attrs: Record<string, string>, resolve: Resolve): Record<string, string> {
    return Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, resolve(value)]));
}

// Dynamic creates known SVG tags in the SVG namespace and keeps the data's DOM attribute names
function SvgNode(props: { node: IconNode; resolve: Resolve }) {
    return (
        <Dynamic component={props.node[0]} {...resolveAttrs(props.node[1], props.resolve)}>
            <For each={props.node[2] ?? []}>{(child) => <SvgNode node={child} resolve={props.resolve} />}</For>
        </Dynamic>
    );
}

export function createSvgComponent(data: IconData) {
    return function SemiSvg(props: SvgProps) {
        const uid = createUniqueId();
        const [local, rest] = splitProps(props, ['fill']);
        const colors = createMemo(() => (data.fills ? getFillColor(local.fill, data.fills) : []));
        const resolve: Resolve = (value) => resolveValue(value, colors(), uid);
        const rootFill = () => (!data.fills && local.fill !== undefined ? { fill: String(local.fill) } : {});
        return (
            <svg {...resolveAttrs({ ...data.attrs, focusable: 'false', 'aria-hidden': 'true' }, resolve)} {...rootFill()} {...rest}>
                <For each={data.children}>{(child) => <SvgNode node={child} resolve={resolve} />}</For>
            </svg>
        );
    };
}

export function createIcon(data: IconData) {
    const Svg = createSvgComponent({ ...data, attrs: { ...data.attrs, ...defaultAttrs } });
    return function SemiIcon(props: Omit<IconProps, 'svg' | 'type'>) {
        return <Icon {...props} type={data.name} svg={Svg} />;
    };
}
