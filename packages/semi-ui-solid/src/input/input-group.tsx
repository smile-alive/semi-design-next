import { Show, children, createMemo, createUniqueId, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/input/constants';
import '@fibrae/semi-foundation/input/input.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import Label, { type LabelProps } from '../form/label';
import useLocale from '../locale/use-locale';
import { type InputGroupContextValue, InputGroupContext } from './context';
import type { InputSize } from './input';

const prefixCls = cssClasses.PREFIX;

/** `class`, `style` and `ref` go to the role="group" span; other attributes go to every control in the group */
export interface InputGroupProps extends ElementProps<'span', 'onFocus' | 'onBlur'> {
    /** Replaces the size of every control in the group */
    size?: InputSize;
    /** Fires as focus leaves any control in the group, also for a move to another control in it */
    onBlur?: (e: FocusEvent) => void;
    /** Fires as any control in the group takes focus, also for a move from another control in it */
    onFocus?: (e: FocusEvent) => void;
    /** Rendered above or beside the group, which it names */
    label?: LabelProps;
    labelPosition?: 'top' | 'left' | (string & {});
    /** Applies to the controls that set no `disabled` of their own */
    disabled?: boolean;
}

const defaultProps = {
    size: 'default',
} satisfies Partial<InputGroupProps>;

export default function InputGroup(rawProps: InputGroupProps) {
    const props = useDefaultProps('InputGroup', rawProps, defaultProps);
    const [local, attrs] = splitProps(props, ['children', 'class', 'disabled', 'label', 'labelPosition', 'onBlur', 'onFocus', 'ref', 'size', 'style']);

    const locale = useLocale('Input');
    const layer = usePopupLayer();

    const generatedId = createUniqueId();

    // an object literal prop builds its JSX again on every read, so it is read once
    const label = createMemo(() => local.label);
    const labelText = children(() => label()?.text);
    const view = createMemo(() => ({ size: local.size, disabled: local.disabled }));
    const context: InputGroupContextValue = { view, attrs, layer };

    const labelId = () => label()?.id ?? `${generatedId}-label`;

    const hasLabel = () => hasContent(labelText());

    // a label toggling on or off remounts the controls, as the extra wrapper does in React
    const group = (labelled: boolean) => (
        <span
            // called inside Show, whose memo would track this read; a spread props signal would recreate the controls
            ref={untrack(() => mergeRefs(local.ref))}
            // a span is not labelable, so aria-labelledby names the group rather than the label's `for`
            id={labelled ? (label()?.name ?? `${generatedId}-group`) : undefined}
            class={clsx(`${prefixCls}-group`, { [`${prefixCls}-${local.size}`]: local.size !== 'default' }, local.class)}
            style={local.style}
            role="group"
            aria-label={labelled ? undefined : locale().locale.group}
            aria-labelledby={labelled ? labelId() : undefined}
            onFocusIn={(e) => local.onFocus?.(e)}
            onFocusOut={(e) => local.onBlur?.(e)}
        >
            <InputGroupContext.Provider value={context}>{local.children}</InputGroupContext.Provider>
        </span>
    );

    return (
        <Show when={hasLabel()} fallback={group(false)}>
            <div
                class={clsx(`${prefixCls}-group-wrapper`, {
                    [`${prefixCls}-group-wrapper-with-top-label`]: local.labelPosition === 'top',
                    [`${prefixCls}-group-wrapper-with-left-label`]: local.labelPosition === 'left',
                })}
            >
                <Label {...label()} id={labelId()} text={labelText()} />
                {group(true)}
            </div>
        </Show>
    );
}
