import { children, createMemo, createUniqueId, onCleanup, onMount, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { radioClasses as css, type strings } from '@fibrae/semi-foundation/components/radio/constants';
import RadioFoundation, { type RadioAdapter, type RadioBaseState, type RadioChangeEvent } from '@fibrae/semi-foundation/components/radio/radio-foundation';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/radio/radio.scss';
import { IconRadio } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import autofocus from '../../utils/autofocus';
import callHandler from '../../utils/call-handler';
import { isNativeInputKey, omitFormInjected, splitControlAttrs } from '../../utils/control-attrs';
import forwardFocus from '../../utils/forward-focus';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import { useSpecialTrigger } from '../tooltip/context';
import { type RadioMode, useRadioGroupContext } from './context';

export type RadioDisplayMode = 'vertical' | '';
export type RadioType = typeof strings.TYPE_DEFAULT | typeof strings.TYPE_BUTTON | typeof strings.TYPE_CARD | typeof strings.TYPE_PURECARD;

export interface RadioProps extends ElementProps<'label', 'onChange' | 'onFocus' | 'onBlur' | 'onfocus' | 'onblur'> {
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
    /** Attached to the native input, like `onFocus` */
    onfocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
    /** Attached to the native input, like `onBlur` */
    onblur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
}

export type RadioState = RadioBaseState;

export type { RadioChangeEvent };

type Foundation = RadioFoundation<RadioProps>;
type Adapter = RadioAdapter<RadioProps>;

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
    const foundationProps = omitFormInjected(props);

    const group = useRadioGroupContext();

    const uid = createUniqueId();
    let input!: HTMLInputElement;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: view().disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, RadioProps, RadioState>(
        RadioFoundation,
        foundationProps,
        (view) => RadioFoundation.getInitialState(view),
        (base) => ({
            notifyGroupChange: (event) => group?.onChange(event),
            notifyChange: (event) => base.getProps().onChange?.(event),
            getInput: () => input,
        }),
        { context: () => group?.view() }
    );

    const view = createMemo(() => RadioFoundation.deriveView(foundationProps, state(), group?.view()));
    const content = children(() => local.children);

    // a button radio is only its label, so its extra is not created either
    const extra = children(() => (view().isButtonRadio ? undefined : local.extra));

    const prefix = () => view().prefixCls || css.PREFIX;

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
