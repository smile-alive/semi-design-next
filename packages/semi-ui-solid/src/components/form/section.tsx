import { type JSX, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { joinIds } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'fieldset'> {
    text?: JSX.Element;
    /** Shown below the title and describes the fieldset */
    extraText?: JSX.Element;
}

export default function Section(props: SectionProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'text', 'extraText', 'aria-describedby']);

    const extraId = createUniqueId();

    const text = children(() => local.text);
    const extraText = children(() => local.extraText);

    return (
        <fieldset {...rest} aria-describedby={joinIds(local['aria-describedby'], hasContent(extraText()) && extraId)} class={clsx(`${prefix}-section`, local.class)}>
            {/* an empty legend would still draw its divider */}
            <Show when={hasContent(text())}>
                <legend class={`${prefix}-section-text`}>{text()}</legend>
            </Show>
            <Show when={hasContent(extraText())}>
                <div class={`${prefix}-section-extra`} id={extraId}>
                    {extraText()}
                </div>
            </Show>
            {local.children}
        </fieldset>
    );
}
