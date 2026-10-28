import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/form/form.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeStyles from '../_base/merge-styles';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface LabelProps extends ElementProps<'label'> {
    /** text-align of label */
    align?: string;
    disabled?: boolean;
    /** Whether to display the required * symbol */
    required?: boolean;
    /** Content of label; `children` when not set */
    text?: JSX.Element;
    /** The `for` of the label element; the consumer's `for` applies when not set */
    name?: string;
    /** width of label, a number in px */
    width?: number | string;
    extra?: JSX.Element;
    optional?: boolean;
}

export default function Label(props: LabelProps) {
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'disabled', 'extra', 'for', 'name', 'optional', 'required', 'style', 'text', 'width']);

    const locale = useLocale('Form');

    // each read of a JSX prop creates its nodes again, so `text` is read once
    const content = children(() => {
        const text = local.text;
        return text !== undefined ? text : local.children;
    });

    const extra = children(() => local.extra);

    const align = () => local.align ?? 'left';

    const style = (): JSX.CSSProperties | string | undefined => {
        if (!local.width) {
            return local.style;
        }
        return mergeStyles(local.style, { width: toCssLength(local.width) });
    };

    return (
        <label
            {...rest}
            for={local.name || local.for || undefined}
            class={clsx(local.class, `${prefixCls}-field-label`, {
                [`${prefixCls}-field-label-left`]: align() === 'left',
                [`${prefixCls}-field-label-right`]: align() === 'right',
                [`${prefixCls}-field-label-required`]: local.required && !local.optional,
                [`${prefixCls}-field-label-disabled`]: local.disabled,
                [`${prefixCls}-field-label-with-extra`]: hasContent(extra()),
            })}
            style={style()}
        >
            <div class={`${prefixCls}-field-label-text`} x-semi-prop="label">
                {content()}
                <Show when={local.optional}>
                    <span class={`${prefixCls}-field-label-optional-text`}>{locale().locale.optional}</span>
                </Show>
            </div>
            <Show when={hasContent(extra())}>
                <div class={`${prefixCls}-field-label-extra`}>{extra()}</div>
            </Show>
        </label>
    );
}
