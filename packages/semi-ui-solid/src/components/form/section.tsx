import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

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
