import { type JSX, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type FormSectionPart } from '@fibrae/semi-foundation/components/form/constants';
import { joinIds } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'fieldset'> {
    text?: JSX.Element;
    /** Shown below the title and describes the fieldset */
    extraText?: JSX.Element;
    classNames?: Partial<Record<FormSectionPart, string>>;
    styles?: Partial<Record<FormSectionPart, JSX.CSSProperties | string>>;
}

export default function Section(props: SectionProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'classNames', 'text', 'extraText', 'styles', 'aria-describedby']);

    const extraId = createUniqueId();

    const text = children(() => local.text);
    const extraText = children(() => local.extraText);

    return (
        <fieldset {...rest} aria-describedby={joinIds(local['aria-describedby'], hasContent(extraText()) && extraId)} class={clsx(`${prefix}-section`, local.class)}>
            {/* an empty legend would still draw its divider */}
            <Show when={hasContent(text())}>
                <legend class={clsx(`${prefix}-section-text`, local.classNames?.title)} style={local.styles?.title}>
                    {text()}
                </legend>
            </Show>
            <Show when={hasContent(extraText())}>
                <div class={clsx(`${prefix}-section-extra`, local.classNames?.extra)} style={local.styles?.extra} id={extraId}>
                    {extraText()}
                </div>
            </Show>
            {local.children}
        </fieldset>
    );
}
