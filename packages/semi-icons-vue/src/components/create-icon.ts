import { type PropType, type VNode, defineComponent, h, useId } from 'vue';
import type { IconData, IconNode } from '@fibrae/semi-icons-core';
import { defaultAttrs, getFillColor, resolveValue } from '@fibrae/semi-icons-core/utils';
import Icon from './icon.vue';
import type { IconProps } from './interface';

function resolveAttrs(attrs: Record<string, string>, resolve: (value: string) => string): Record<string, string> {
    return Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, resolve(value)]));
}

function renderNode([tag, attrs, children = []]: IconNode, resolve: (value: string) => string): VNode {
    return h(
        tag,
        resolveAttrs(attrs, resolve),
        children.map((child) => renderNode(child, resolve))
    );
}

export function createSvgComponent(data: IconData) {
    // The SVG data is a tree, so it renders through h(), not a static template
    return defineComponent({
        name: 'SemiSvg',
        inheritAttrs: false,
        props: { fill: { type: [String, Array] as PropType<string | string[]>, default: undefined } },
        setup(props, { attrs }) {
            const uid = useId();
            return () => {
                const colors = data.fills ? getFillColor(props.fill, data.fills) : [];
                const resolve = (value: string) => resolveValue(value, colors, uid);
                return h(
                    'svg',
                    {
                        ...resolveAttrs(data.attrs, resolve),
                        focusable: 'false',
                        'aria-hidden': 'true',
                        ...(!data.fills && props.fill !== undefined && { fill: props.fill }),
                        ...attrs,
                    },
                    data.children.map((child) => renderNode(child, resolve))
                );
            };
        },
    });
}

export function createIcon(data: IconData) {
    const Svg = createSvgComponent({ ...data, attrs: { ...data.attrs, ...defaultAttrs } });
    // No runtime props: everything stays in attrs; Icon declares, normalizes and defaults them
    const Component = defineComponent<Omit<IconProps, 'type'>>(
        (_, { attrs }) =>
            () =>
                h(Icon, { ...attrs, type: data.name }, { default: () => h(Svg) }),
        { name: 'SemiIcon', inheritAttrs: false }
    );
    return Object.assign(Component, { elementType: 'Icon' });
}
