import { children, onMount, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/switch/constants';
import SwitchFoundation, { type SwitchAdapter, type SwitchState } from '@fibrae/semi-foundation/switch/foundation';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/switch/switch.scss';
import autofocus from '../_base/autofocus';
import { isNativeInputKey, omitFormInjected, splitControlAttrs } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Spin from '../spin';
import { useSpecialTrigger } from '../tooltip/context';

type SwitchChangeEvent = Event & { currentTarget: HTMLInputElement; target: HTMLInputElement };

export interface SwitchProps extends ElementProps<'div', 'onChange' | 'onFocus' | 'onBlur'> {
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

type Foundation = SwitchFoundation<SwitchProps, SwitchState, SwitchChangeEvent>;
type Adapter = SwitchAdapter<SwitchProps, SwitchState, SwitchChangeEvent>;

const defaultProps = {
    disabled: false,
    loading: false,
    size: 'default',
} satisfies Partial<SwitchProps>;

export default function Switch(rawProps: SwitchProps) {
    const props = useDefaultProps('Switch', rawProps, defaultProps);
    const [local, attrs] = splitProps(omitFormInjected(props), ['class', 'size', 'checkedText', 'uncheckedText', 'loading', 'disabled', 'defaultChecked', 'checked', 'onChange', 'ref']);

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
            setChecked: (checked) => base.setState({ checked }),
            notifyChange: (checked, event) => base.getProps().onChange?.(checked, event),
        })
    );

    const checked = () => SwitchFoundation.deriveChecked(local, state());

    // only the text of the current state is created, and none on a small switch, which renders neither
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

    useWatch(() => local.checked, foundation.setChecked);

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
            <Show when={local.loading} fallback={<div class={cssClasses.KNOB} aria-hidden="true" />}>
                <Spin wrapperClassName={cssClasses.LOADING_SPIN} size={local.size === 'default' ? 'middle' : local.size} />
            </Show>
            <Show when={hasContent(checkedText())}>
                <div class={cssClasses.CHECKED_TEXT} x-semi-prop="checkedText">
                    {checkedText()}
                </div>
            </Show>
            <Show when={hasContent(uncheckedText())}>
                <div class={cssClasses.UNCHECKED_TEXT} x-semi-prop="uncheckedText">
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
