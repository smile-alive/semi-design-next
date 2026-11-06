import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import '@fibrae/semi-foundation/form/form.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'fieldset'> {
    text?: JSX.Element;
}

export default function Section(props: SectionProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'text']);

    const text = children(() => local.text);

    return (
        <fieldset {...rest} class={clsx(`${prefix}-section`, local.class)}>
            {/* an empty legend would still draw its divider */}
            <Show when={hasContent(text())}>
                <legend class={`${prefix}-section-text`}>{text()}</legend>
            </Show>
            {local.children}
        </fieldset>
    );
}
