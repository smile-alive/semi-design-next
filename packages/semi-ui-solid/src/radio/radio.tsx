import { children, createMemo, createUniqueId, onCleanup, onMount, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { radioClasses as css, type strings } from '@fibrae/semi-foundation/radio/constants';
import RadioFoundation, { type RadioAdapter, type RadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/radio/radio.scss';
import { IconRadio } from '@fibrae/semi-icons-solid';
import autofocus from '../_base/autofocus';
import callHandler from '../_base/call-handler';
import { isNativeInputKey, omitFormInjected, splitControlAttrs } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import { useSpecialTrigger } from '../tooltip/context';
import { type RadioMode, useRadioGroupContext } from './context';

export type RadioDisplayMode = 'vertical' | '';
export type RadioType = typeof strings.TYPE_DEFAULT | typeof strings.TYPE_BUTTON | typeof strings.TYPE_CARD | typeof strings.TYPE_PURECARD;

export interface RadioProps extends ElementProps<'label', 'onChange' | 'onFocus' | 'onBlur'> {
    checked?: boolean;
    defaultChecked?: boolean;
    value?: string | number | boolean;
    disabled?: boolean;
    prefixCls?: string;
    displayMode?: RadioDisplayMode;
    onChange?: (event: RadioChangeEvent) => void;
    mode?: RadioMode;
    extra?: JSX.Element;
    addonStyle?: JSX.CSSProperties | string;
    addonClassName?: string;
    type?: RadioType;
    addonId?: string;
    extraId?: string;
    /** Attached to the native input; inside a group it overrides the group's name */
    name?: string;
    /** Passed to `focus()` of the root element, which focuses the native input */
    preventScroll?: boolean;
    /** Attached to the native input: focus does not bubble, so the root would never receive it */
    onFocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
    /** Attached to the native input: focus does not bubble, so the root would never receive it */
    onBlur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
}

export interface RadioState {
    checked?: boolean;
}

export type { RadioChangeEvent };

type Foundation = RadioFoundation<RadioProps, RadioState>;
type Adapter = RadioAdapter<RadioProps, RadioState>;

const defaultProps = {
    defaultChecked: false,
    mode: '',
    type: 'default',
} satisfies Partial<RadioProps>;

export default function Radio(rawProps: RadioProps) {
    const props = useDefaultProps('Radio', rawProps, defaultProps);
    const [local, attrs] = splitProps(omitFormInjected(props), ['class', 'children', 'extra', 'ref', 'checked', 'defaultChecked', 'value', 'disabled', 'prefixCls', 'displayMode', 'onChange', 'onClick', 'mode', 'addonStyle', 'addonClassName', 'type', 'addonId', 'extraId', 'preventScroll']);

    // The root is a label, so what names, identifies and focuses the radio belongs on the native input
    const [control, rest] = splitControlAttrs(attrs, isNativeInputKey);

    // The radio role supports no aria-invalid, aria-errormessage or aria-required (radiogroup does): the error goes in the description
    const [unsupported, inputAttrs] = splitProps(control, ['aria-invalid', 'aria-errormessage', 'aria-required']);

    // children and extra are JSX: spreading them into the onChange event would build their nodes again
    const [, eventProps] = splitProps(omitFormInjected(props), ['children', 'extra', 'ref']);

    const group = useRadioGroupContext();

    const uid = createUniqueId();
    let input!: HTMLInputElement;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: view().disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, RadioProps, RadioState>(
        RadioFoundation,
        eventProps,
        // only the initial value is wanted: later changes of `checked` arrive through the effect below
        (view) => RadioFoundation.getInitialState(view),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyGroupChange: (event) => group?.onChange(event),
            notifyChange: (event) => base.getProps().onChange?.(event),
            getInput: () => input,
        }),
        { context: () => group?.view() }
    );

    const view = createMemo(() => RadioFoundation.deriveView(eventProps, state(), group?.view()));
    const content = children(() => local.children);

    // a button radio is only its label, so its extra is not created either
    const extra = children(() => (view().isButtonRadio ? undefined : local.extra));

    const prefix = () => view().prefixCls || css.PREFIX;

    // the circle keeps the radio's own prefix, not the group's
    const innerPrefix = () => local.prefixCls || css.PREFIX;

    const addonId = () => local.addonId || `addon-${uid}`;

    const extraId = () => local.extraId || `extra-${uid}`;

    const hasChildren = () => hasContent(content());

    const hasExtra = () => hasContent(extra());

    // A native radio checks itself, and unchecks its same-name peers, whatever the owner decides. Solid skips a value
    // that did not change, so the DOM is written back after the owner has answered.
    const sync = () => {
        input.checked = view().checked;
    };

    const requestSync = () => (group ? group.sync() : sync());

    const handleChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        foundation.handleChange(event.currentTarget.checked, event);
        requestSync();
    };

    // Clicking an unchecked radio is followed by a change event; writing back before it would hide the new state
    const handleClick = (event: MouseEvent) => {
        const wasChecked = view().checked;
        foundation.handleClick(event);
        if (wasChecked) {
            requestSync();
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const wasChecked = view().checked;
        foundation.handleKeyUp(event);
        if (wasChecked) {
            requestSync();
        }
    };

    // the browser repeats a click on the label text as a click on the input; the owner's handler hears it once
    const handleLabelClick = (event: MouseEvent & { currentTarget: HTMLLabelElement; target: Element }) => {
        if (event.target === input) {
            callHandler(local.onClick, event);
        }
    };

    const focusOptions = () => ({ preventScroll: local.preventScroll });

    const setup = (node: HTMLLabelElement) => {
        forwardFocus(node, () => input, focusOptions);
        registerTrigger(node);
    };

    // `checked` going back to undefined (a Form reset) unchecks; other non-boolean values are ignored
    useWatch(
        () => local.checked,
        (checked) => {
            if (checked === undefined) {
                foundation.setChecked(false);
            } else if (typeof checked === 'boolean') {
                foundation.setChecked(checked);
            }
        }
    );

    onMount(() => {
        autofocus(control.autofocus, input);
        if (group) {
            onCleanup(group.register(sync));
        }
    });

    return (
        <label
            {...rest}
            ref={mergeRefs(local.ref, setup)}
            class={clsx(prefix(), local.class, {
                [`${prefix()}-disabled`]: view().disabled,
                [`${prefix()}-checked`]: view().checked,
                [`${prefix()}-${local.displayMode}`]: Boolean(local.displayMode),
                [`${prefix()}-buttonRadioComponent`]: !view().inGroup && view().isButtonRadio,
                [`${prefix()}-buttonRadioGroup`]: view().isButtonRadio,
                [`${prefix()}-buttonRadioGroup-${view().buttonSize}`]: view().isButtonRadio && view().buttonSize,
                [`${prefix()}-cardRadioGroup`]: view().isCardRadio,
                [`${prefix()}-cardRadioGroup_disabled`]: view().disabled && view().isCardRadio,
                [`${prefix()}-cardRadioGroup_checked`]: view().isCardRadio && view().checked && !view().disabled,
                [`${prefix()}-cardRadioGroup_checked_disabled`]: view().isCardRadio && view().checked && view().disabled,
            })}
            onClick={handleLabelClick}
        >
            <span
                class={clsx(`${innerPrefix()}-inner`, {
                    [`${innerPrefix()}-inner-checked`]: view().checked,
                    [`${innerPrefix()}-inner-buttonRadio`]: view().isButtonRadio,
                    [`${innerPrefix()}-inner-pureCardRadio`]: view().isPureCardRadio,
                })}
            >
                <input
                    {...inputAttrs}
                    ref={(node) => (input = node)}
                    type="radio"
                    name={control.name ?? group?.view().radioGroup?.name}
                    aria-describedby={joinIds(control['aria-describedby'], hasExtra() ? extraId() : undefined, unsupported['aria-invalid'] ? unsupported['aria-errormessage'] : undefined)}
                    aria-labelledby={joinIds(control['aria-labelledby'], hasChildren() ? addonId() : undefined)}
                    checked={view().checked}
                    disabled={view().disabled}
                    value={local.value === undefined ? undefined : String(local.value)}
                    onChange={handleChange}
                    onClick={handleClick}
                    onKeyUp={handleKeyUp}
                />
                <span class={clsx({ [`${innerPrefix()}-inner-display`]: !view().isButtonRadio })}>
                    <Show when={view().checked}>
                        <IconRadio />
                    </Show>
                </span>
            </span>
            <Show when={hasChildren() || hasExtra()}>
                <div class={clsx(`${prefix()}-content`, { [`${prefix()}-isCardRadioGroup_content`]: view().isCardRadio })}>
                    <Show when={hasChildren()}>
                        <span
                            id={addonId()}
                            class={clsx(
                                {
                                    [`${prefix()}-addon`]: !view().isButtonRadio,
                                    [`${prefix()}-addon-buttonRadio`]: view().isButtonRadio,
                                    [`${prefix()}-addon-buttonRadio-checked`]: view().isButtonRadio && view().checked,
                                    [`${prefix()}-addon-buttonRadio-disabled`]: view().isButtonRadio && view().disabled,
                                    [`${prefix()}-addon-buttonRadio-${view().buttonSize}`]: view().isButtonRadio && view().buttonSize,
                                },
                                local.addonClassName
                            )}
                            style={local.addonStyle}
                            x-semi-prop="children"
                        >
                            {content()}
                        </span>
                    </Show>
                    <Show when={hasExtra()}>
                        <div id={extraId()} class={`${prefix()}-extra`} x-semi-prop="extra">
                            {extra()}
                        </div>
                    </Show>
                </div>
            </Show>
        </label>
    );
}
