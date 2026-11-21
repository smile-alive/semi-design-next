import { children, onMount, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type SwitchPart } from '@fibrae/semi-foundation/components/switch/constants';
import SwitchFoundation, { type SwitchAdapter, type SwitchState } from '@fibrae/semi-foundation/components/switch/foundation';
import type { Size } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/switch/switch.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { autofocus, isNativeInputKey, omitFormInjected, splitControlAttrs, forwardFocus, hasContent, mergeRefs } from '../../utils/index';
import Spin from '../spin';
import { useSpecialTrigger } from '../tooltip/context';

type SwitchChangeEvent = Event & { currentTarget: HTMLInputElement; target: HTMLInputElement };

type Style = JSX.CSSProperties | string;

export interface SwitchProps extends ElementProps<'div', 'onChange' | 'onFocus' | 'onBlur'> {
    classNames?: Partial<Record<SwitchPart, string>>;
    styles?: Partial<Record<SwitchPart, Style>>;
    defaultChecked?: boolean;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean, event: SwitchChangeEvent) => void;
    loading?: boolean;
    size?: Size;
    checkedText?: JSX.Element;
    uncheckedText?: JSX.Element;
    /** Attached to the native control */
    name?: string;
    /** Attached to the native control: focus does not bubble, so the root would never receive it */
    onFocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
    /** Attached to the native control: focus does not bubble, so the root would never receive it */
    onBlur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
}

export type { SwitchState };

type Foundation = SwitchFoundation<SwitchProps, SwitchChangeEvent>;
type Adapter = SwitchAdapter<SwitchProps, SwitchChangeEvent>;

const defaultProps = {
    disabled: false,
    loading: false,
    size: 'default',
} satisfies Partial<SwitchProps>;

export default function Switch(rawProps: SwitchProps) {
    const props = useDefaultProps('Switch', rawProps, defaultProps);
    const [local, attrs] = splitProps(omitFormInjected(props), ['class', 'classNames', 'styles', 'size', 'checkedText', 'uncheckedText', 'loading', 'disabled', 'defaultChecked', 'checked', 'onChange', 'ref']);

    // The root is a div, so what names, identifies and focuses the switch belongs on the native input
    const [control, rest] = splitControlAttrs(attrs, isNativeInputKey);

    let input!: HTMLInputElement;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, SwitchProps, SwitchState>(
        SwitchFoundation,
        props,
        (view) => SwitchFoundation.getInitialState(view),
        (base) => ({
            notifyChange: (checked, event) => base.getProps().onChange?.(checked, event),
        })
    );

    const checked = () => SwitchFoundation.deriveChecked(local, state());

    const checkedText = children(() => (checked() && local.size !== 'small' ? local.checkedText : undefined));
    const uncheckedText = children(() => (!checked() && local.size !== 'small' ? local.uncheckedText : undefined));

    const setRoot = (node: HTMLDivElement) => {
        forwardFocus(node, () => input);
        registerTrigger(node);
    };

    const handleChange = (event: SwitchChangeEvent) => {
        foundation.handleChange(event.currentTarget.checked, event);
        // Solid does not re-apply an unchanged controlled value after the browser toggles the checkbox
        event.currentTarget.checked = checked();
    };

    onMount(() => autofocus(control.autofocus, input));

    return (
        <div
            {...rest}
            // an enclosing Tooltip wraps a disabled switch so that it still receives the pointer (F4)
            ref={mergeRefs(local.ref, setRoot)}
            class={clsx(cssClasses.PREFIX, local.class, {
                [cssClasses.CHECKED]: checked(),
                [cssClasses.DISABLED]: local.disabled,
                [cssClasses.LARGE]: local.size === 'large',
                [cssClasses.SMALL]: local.size === 'small',
                [cssClasses.LOADING]: local.loading,
            })}
        >
            <Show when={local.loading} fallback={<div class={clsx(cssClasses.KNOB, local.classNames?.indicator)} style={local.styles?.indicator} aria-hidden="true" />}>
                <Spin class={clsx(cssClasses.LOADING_SPIN, local.classNames?.indicator)} style={local.styles?.indicator} size={local.size === 'default' ? 'middle' : local.size} />
            </Show>
            <Show when={hasContent(checkedText())}>
                <div class={clsx(cssClasses.CHECKED_TEXT, local.classNames?.content)} style={local.styles?.content} x-semi-prop="checkedText">
                    {checkedText()}
                </div>
            </Show>
            <Show when={hasContent(uncheckedText())}>
                <div class={clsx(cssClasses.UNCHECKED_TEXT, local.classNames?.content)} style={local.styles?.content} x-semi-prop="uncheckedText">
                    {uncheckedText()}
                </div>
            </Show>
            <input
                {...control}
                ref={(node) => (input = node)}
                type="checkbox"
                role="switch"
                class={cssClasses.NATIVE_CONTROL}
                // a disabled input drops focus, so loading is conveyed by aria only
                aria-disabled={local.loading || undefined}
                checked={checked()}
                disabled={local.disabled}
                onChange={handleChange}
            />
        </div>
    );
}
