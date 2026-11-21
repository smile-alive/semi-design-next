import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type FormLabelPart } from '@fibrae/semi-foundation/components/form/constants';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/form/form.scss';
import { IconHelpCircleStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../../base/index';
import { hasContent, mergeStyles } from '../../utils/index';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import { useFormContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface LabelProps extends ElementProps<'label'> {
    align?: string;
    disabled?: boolean;
    required?: boolean;
    /** Content of label; `children` when not set */
    text?: JSX.Element;
    /** The `for` of the label element; the consumer's `for` applies when not set */
    name?: string;
    /** width of label, a number in px */
    width?: number | string;
    extra?: JSX.Element;
    /** Shown in a Tooltip by a help button beside the label; the button is not part of the field's name */
    tooltip?: JSX.Element;
    optional?: boolean;
    classNames?: Partial<Record<FormLabelPart, string>>;
    styles?: Partial<Record<FormLabelPart, JSX.CSSProperties | string>>;
}

export default function Label(props: LabelProps) {
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'classNames', 'disabled', 'extra', 'for', 'name', 'optional', 'required', 'style', 'styles', 'text', 'tooltip', 'width']);

    const locale = useLocale('Form');

    const form = useFormContext()?.formProps;

    // each read of a JSX prop creates its nodes again, so `text` is read once
    const content = children(() => {
        const text = local.text;
        return text !== undefined ? text : local.children;
    });

    const extra = children(() => local.extra);
    const tooltip = children(() => local.tooltip);

    const align = () => local.align ?? 'left';

    const style = () => mergeStyles(form?.styles?.label, local.style, local.width && !hasContent(tooltip()) ? { width: toCssLength(local.width) } : undefined);

    const renderLabel = () => (
        <label
            {...rest}
            for={local.name || local.for || undefined}
            class={clsx(form?.classNames?.label, local.class, `${prefixCls}-field-label`, {
                [`${prefixCls}-field-label-left`]: align() === 'left',
                [`${prefixCls}-field-label-right`]: align() === 'right',
                [`${prefixCls}-field-label-required`]: local.required && !local.optional,
                [`${prefixCls}-field-label-disabled`]: local.disabled,
                [`${prefixCls}-field-label-with-extra`]: hasContent(extra()),
            })}
            style={style()}
        >
            <div class={clsx(`${prefixCls}-field-label-text`, form?.classNames?.labelText, local.classNames?.text)} style={mergeStyles(form?.styles?.labelText, local.styles?.text)} x-semi-prop="label">
                {content()}
                <Show when={local.optional}>
                    <span class={`${prefixCls}-field-label-optional-text`}>{locale().locale.optional}</span>
                </Show>
            </div>
            <Show when={hasContent(extra())}>
                <div class={clsx(`${prefixCls}-field-label-extra`, form?.classNames?.labelExtra, local.classNames?.extra)} style={mergeStyles(form?.styles?.labelExtra, local.styles?.extra)}>
                    {extra()}
                </div>
            </Show>
        </label>
    );

    return (
        <Show when={hasContent(tooltip())} fallback={renderLabel()}>
            <div class={`${prefixCls}-field-label-with-tooltip`} style={local.width ? { width: toCssLength(local.width) } : undefined}>
                {renderLabel()}
                <Tooltip content={tooltip()}>
                    {(getTriggerProps) => (
                        <button {...getTriggerProps()} type="button" class={clsx(`${prefixCls}-field-label-tooltip`, form?.classNames?.labelTooltip, local.classNames?.tooltip)} style={mergeStyles(form?.styles?.labelTooltip, local.styles?.tooltip)} aria-label={locale().locale.labelTooltip}>
                            <IconHelpCircleStroked size="inherit" />
                        </button>
                    )}
                </Tooltip>
            </div>
        </Show>
    );
}
