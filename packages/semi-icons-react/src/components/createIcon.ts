import * as React from 'react';
import type { IconData, IconNode } from '@fibrae/semi-icons-core';
import { defaultAttrs, getFillColor, resolveValue } from '@fibrae/semi-icons-core/utils';
import { convertIcon } from './Icon';

// fill-rule -> fillRule, xlink:href -> xlinkHref, mask-type -> maskType
function camelCase(name: string) {
    return name.replace(/[-:]([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

// The data keeps DOM attribute names for any framework; React needs camelCase props, className and a style object
function toProps(attrs: Record<string, string>, resolve: (value: string) => string) {
    const props: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(attrs)) {
        if (name === 'style') {
            props.style = Object.fromEntries(
                resolve(value)
                    .split(';')
                    .filter((declaration) => declaration.includes(':'))
                    .map((declaration) => {
                        const colon = declaration.indexOf(':');
                        return [camelCase(declaration.slice(0, colon).trim()), declaration.slice(colon + 1).trim()];
                    })
            );
        } else if (name === 'class') {
            props.className = resolve(value);
        } else {
            props[/^(aria|data)-/.test(name) ? name : camelCase(name)] = resolve(value);
        }
    }
    return props;
}

function renderNode([tag, attrs, children = []]: IconNode, resolve: (value: string) => string): React.ReactElement {
    return React.createElement(tag, toProps(attrs, resolve), ...children.map((child) => renderNode(child, resolve)));
}

/** A decorative svg component from icon or illustration data, without the Icon wrapper */
export function createSvgComponent(data: IconData) {
    function SvgComponent(props: React.SVGProps<SVGSVGElement>) {
        // gradient and filter ids must be unique per instance; every icon pays for useId rather than a per-icon branch
        const uid = React.useId();
        // A multi-colour icon spreads `fill` over its own elements; any other icon passes it to the root svg
        const { fill, ...rest } = props;
        const colors = data.fills ? getFillColor(fill, data.fills) : [];
        const resolve = (value: string) => resolveValue(value, colors, uid);
        return React.createElement(
            'svg',
            {
                ...toProps({ ...data.attrs, focusable: 'false', 'aria-hidden': 'true' }, resolve),
                ...(data.fills ? rest : props),
            },
            ...data.children.map((child) => renderNode(child, resolve))
        );
    }
    return SvgComponent;
}

/** A React icon component from the icon's data in @fibrae/semi-icons-core */
export function createIcon(data: IconData) {
    return convertIcon(createSvgComponent({ ...data, attrs: { ...data.attrs, ...defaultAttrs } }), data.name);
}
