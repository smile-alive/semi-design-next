import { children, createEffect, createMemo, createUniqueId, Match, onMount, Show, splitProps, Switch, type Accessor, type JSX } from 'solid-js';
import clsx from 'clsx';
import CheckboxFoundation, { type CheckboxAdapter, type CheckboxView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
import type { CheckboxValue } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
import { checkboxClasses as css } from '@fibrae/semi-foundation/checkbox/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import '@fibrae/semi-foundation/checkbox/checkbox.scss';
import { IconCheckboxIndeterminate, IconCheckboxTick } from '@fibrae/semi-icons-solid';
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
import type { CheckboxType } from './checkbox-group';
import { useCheckboxGroupContext } from './context';

// Type aliases rather than interfaces: the foundation reads the event through an index signature
export type CheckboxEventTarget = {
    checked: boolean;
    value?: CheckboxValue;
    name?: string;
    disabled: boolean;
};

export type CheckboxEvent = {
    target: CheckboxEventTarget;
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent: MouseEvent;
};

export interface CheckboxProps extends ElementProps<'span', 'onChange' | 'onFocus' | 'onBlur'> {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    /** Inside a CheckboxGroup, the value this checkbox adds to the group's value */
    value?: CheckboxValue;
    extra?: JSX.Element;
    onChange?: (event: CheckboxEvent) => any;
    prefixCls?: string;
    addonId?: string;
    extraId?: string;
    type?: CheckboxType;
    /** Passed to `focus()` of the root element, which focuses the native input */
    preventScroll?: boolean;
    /** Attached to the native input; inside a group the group's name wins */
    name?: string;
    /** Attached to the native input: focus does not bubble, so the root would never receive it */
    onFocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
    /** Attached to the native input: focus does not bubble, so the root would never receive it */
    onBlur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
    /** The `x-semi-prop` name of the children slot */
    'x-semi-children-alias'?: string;
}

interface CheckboxState {
    checked: boolean;
}

type FoundationProps = Pick<CheckboxProps, 'checked' | 'defaultChecked' | 'disabled' | 'value' | 'onChange' | 'preventScroll'>;
type Foundation = CheckboxFoundation<FoundationProps, CheckboxState>;
type Adapter = CheckboxAdapter<FoundationProps, CheckboxState>;

const defaultProps = {
    defaultChecked: false,
    indeterminate: false,
    type: 'default',
} satisfies Partial<CheckboxProps>;

export default function Checkbox(rawProps: CheckboxProps) {
    const props = useDefaultProps('Checkbox', rawProps, defaultProps);
    const [local, attrs] = splitProps(omitFormInjected(props), ['class', 'children', 'extra', 'ref', 'checked', 'defaultChecked', 'disabled', 'indeterminate', 'value', 'onChange', 'onClick', 'prefixCls', 'addonId', 'extraId', 'type', 'preventScroll', 'x-semi-children-alias']);

    // The root is a span, so what names, identifies and focuses the checkbox belongs on the native input
    const [control, rest] = splitControlAttrs(attrs, isNativeInputKey);

    const group = useCheckboxGroupContext();

    const uid = createUniqueId();
    let input!: HTMLInputElement;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: disabled() }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, CheckboxState>(
        CheckboxFoundation,
        props,
        // only the initial value is wanted: later changes of `checked` arrive through the effect below
        (view) => ({ checked: Boolean(view.checked ?? view.defaultChecked) }),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyChange: (event) => base.getProps().onChange?.(event as CheckboxEvent),
            generateEvent: (checked, event) => ({
                target: { checked, value: local.value, name: name(), disabled: disabled() },
                stopPropagation: () => event.stopPropagation(),
                preventDefault: () => event.preventDefault(),
                // handleClick passes the click itself as the source event
                nativeEvent: event as MouseEvent,
            }),
            getIsInGroup: () => view().inGroup,
            getGroupValue: () => group?.view().value ?? [],
            notifyGroupChange: (event) => group?.onChange(event),
            getGroupDisabled: () => group?.view().disabled ?? false,
            // script focus matches :focus-visible when nothing was focused; a click must not look like keyboard focus
            focusCheckboxEntity: () => {
                if (input !== input.ownerDocument.activeElement) {
                    focusWithoutRing(input, { preventScroll: base.getProps().preventScroll });
                }
            },
        })
    );

    const content = children(() => local.children);
    const extra = children(() => local.extra);

    // annotated because the adapter above reads it: inferring it would be circular
    const view: Accessor<CheckboxView> = createMemo(() =>
        CheckboxFoundation.deriveView(
            {
                checked: local.checked,
                disabled: local.disabled,
                name: control.name,
                type: local.type,
                value: local.value,
                'aria-invalid': control['aria-invalid'],
                'aria-errormessage': control['aria-errormessage'],
            },
            state(),
            group?.view()
        )
    );

    const checked = () => view().checked;

    const disabled = () => view().disabled;

    const name = () => view().name;

    const isPureCardType = () => view().isPureCardType;

    const isCardType = () => view().isCardType;

    // the native flag is what assistive tech reads as "mixed"; it is a DOM property, not an attribute
    const showMixed = () => Boolean(local.indeterminate && !checked());

    const prefix = () => local.prefixCls || css.PREFIX;

    const addonId = () => local.addonId || `addon-${uid}`;

    const extraId = () => local.extraId || `extra-${uid}`;

    const hasChildren = () => hasContent(content());

    const hasExtra = () => hasContent(extra());

    // a click on the input also bubbles here, so the native toggle and the label click take the same path
    const handleClick = (event: MouseEvent & { currentTarget: HTMLSpanElement; target: Element }) => {
        callHandler(local.onClick, event);
        if (CheckboxFoundation.isInnerInteractiveClick(event.target, event.currentTarget, input)) {
            return;
        }
        foundation.handleChange(event);
        // Solid skips an unchanged value, so a toggle the owner refused (or a click that cleared the native
        // indeterminate flag) must be written back
        input.checked = checked();
        input.indeterminate = showMixed();
    };

    const focusOptions = () => ({ preventScroll: local.preventScroll });

    const setup = (node: HTMLSpanElement) => {
        forwardFocus(node, () => input, focusOptions);
        registerTrigger(node);
    };

    useWatch(
        () => local.checked,
        (value) => {
            // only a boolean or undefined (Form reset) is mirrored; other values keep the current state
            if (value === undefined || typeof value === 'boolean') {
                foundation.setChecked(Boolean(value));
            }
        }
    );

    createEffect(() => {
        input.indeterminate = showMixed();
    });

    onMount(() => autofocus(control.autofocus, input));

    return (
        // span rather than label, for upstream gitlab issue #364
        <span
            {...rest}
            ref={mergeRefs(local.ref, setup)}
            class={clsx(prefix(), local.class, {
                [`${prefix()}-disabled`]: disabled(),
                [`${prefix()}-indeterminate`]: local.indeterminate,
                [`${prefix()}-checked`]: checked(),
                [`${prefix()}-unChecked`]: !checked(),
                [`${prefix()}-cardType`]: isCardType(),
                [`${prefix()}-cardType_disabled`]: disabled() && isCardType(),
                [`${prefix()}-cardType_enable`]: !(disabled() && isCardType()),
                [`${prefix()}-cardType_checked`]: isCardType() && checked() && !disabled(),
                [`${prefix()}-cardType_checked_disabled`]: isCardType() && checked() && disabled(),
            })}
            onClick={handleClick}
        >
            <span
                class={clsx(`${prefix()}-inner`, {
                    [`${prefix()}-inner-checked`]: checked(),
                    [`${prefix()}-inner-pureCardType`]: isPureCardType(),
                })}
            >
                <input
                    {...control}
                    ref={(node) => (input = node)}
                    type="checkbox"
                    class={css.INPUT}
                    name={name()}
                    aria-describedby={joinIds(control['aria-describedby'], hasExtra() ? extraId() : undefined)}
                    aria-errormessage={view().ariaErrormessage}
                    aria-invalid={view().ariaInvalid}
                    aria-labelledby={joinIds(control['aria-labelledby'], hasChildren() ? addonId() : undefined)}
                    checked={checked()}
                    disabled={disabled()}
                    value={local.value === undefined ? undefined : String(local.value)}
                />
                <span class={`${prefix()}-inner-display`}>
                    <Switch>
                        <Match when={checked()}>
                            <IconCheckboxTick />
                        </Match>
                        <Match when={local.indeterminate}>
                            <IconCheckboxIndeterminate />
                        </Match>
                    </Switch>
                </span>
            </span>
            <Show when={hasChildren() || hasExtra()}>
                <div class={`${prefix()}-content`}>
                    <Show when={hasChildren()}>
                        <span id={addonId()} class={`${prefix()}-addon`} x-semi-prop={local['x-semi-children-alias'] || 'children'}>
                            {content()}
                        </span>
                    </Show>
                    <Show when={hasExtra()}>
                        <div
                            id={extraId()}
                            class={clsx(`${prefix()}-extra`, {
                                [`${prefix()}-cardType_extra_noChildren`]: isCardType() && !hasChildren(),
                            })}
                            x-semi-prop="extra"
                        >
                            {extra()}
                        </div>
                    </Show>
                </div>
            </Show>
        </span>
    );
}
