import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { CheckboxValue } from './checkbox-group-foundation';
import { strings } from './constants';

export interface BasicTargetObject {
    [x: string]: any;
    checked: boolean;
}
export interface BasicCheckboxEvent {
    target: BasicTargetObject;
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent: {
        stopImmediatePropagation: () => void;
    };
    [x: string]: any;
}

/** The click that toggles the checkbox: only what the foundation reads or forwards */
export interface CheckboxSourceEvent {
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent?: { stopImmediatePropagation?: () => void };
}
export interface CheckboxAdapter<P extends BaseCheckboxProps = BaseCheckboxProps, S extends CheckboxBaseState = CheckboxBaseState> extends DefaultAdapter<P, S> {
    getIsInGroup: () => boolean;
    getGroupValue: () => CheckboxValue[];
    notifyGroupChange: (e: BasicCheckboxEvent) => void;
    getGroupDisabled: () => boolean;
    setChecked: (checked: boolean) => void;
    notifyChange: (e: BasicCheckboxEvent) => void;
    focusCheckboxEntity: () => void;
    /** Returns the event object passed to onChange, with `target.checked` set to `checked` */
    generateEvent: (checked: boolean, e: CheckboxSourceEvent) => BasicCheckboxEvent;
}

export interface CheckboxBaseState {
    checked: boolean;
}

type AriaInvalid = boolean | 'true' | 'false' | 'grammar' | 'spelling';

/** What a CheckboxGroup hands to the checkboxes inside it */
export interface CheckboxGroupView {
    value: CheckboxValue[];
    disabled: boolean;
    name: string;
    isCardType: boolean;
    isPureCardType: boolean;
    ariaInvalid?: AriaInvalid;
    ariaErrormessage?: string;
}

/** The props deriveView reads; `checked` is the controlled value */
export interface CheckboxViewProps {
    checked?: unknown;
    disabled?: boolean;
    name?: string;
    type?: string;
    value?: CheckboxValue;
    'aria-invalid'?: AriaInvalid;
    'aria-errormessage'?: string;
}

export interface CheckboxView {
    inGroup: boolean;
    checked: boolean;
    disabled: boolean;
    name?: string;
    isCardType: boolean;
    isPureCardType: boolean;
    ariaInvalid?: AriaInvalid;
    ariaErrormessage?: string;
}

/** A click on these inside the content belongs to them, not to the checkbox */
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [contenteditable]:not([contenteditable="false"])';

export default class CheckboxFoundation<P extends BaseCheckboxProps = BaseCheckboxProps, S extends CheckboxBaseState = CheckboxBaseState> extends BaseFoundation<CheckboxAdapter<P, S>, P, S> {
    #notifyChange(checked: boolean, e: CheckboxSourceEvent) {
        const cbValue = this._adapter.generateEvent(checked, e);
        this._adapter.notifyChange(cbValue);
    }

    #handleChangeInGroup(e: CheckboxSourceEvent) {
        const { value } = this.getProps();
        const groupValue = this._adapter.getGroupValue();
        const checked = groupValue.includes(value);
        const newChecked = !checked;
        const event = this._adapter.generateEvent(newChecked, e);
        this._adapter.notifyChange(event);
        this._adapter.notifyGroupChange(event);
    }

    /** How the checkbox looks and behaves, from its own props or, with a value inside a group, from the group */
    static deriveView(props: CheckboxViewProps, state: CheckboxBaseState, group?: CheckboxGroupView | null): CheckboxView {
        if (group && props.value !== undefined) {
            return {
                inGroup: true,
                checked: group.value.includes(props.value),
                disabled: Boolean(group.disabled || props.disabled),
                name: group.name,
                isCardType: Boolean(group.isCardType),
                isPureCardType: Boolean(group.isPureCardType),
                ariaInvalid: props['aria-invalid'] ?? group.ariaInvalid,
                ariaErrormessage: props['aria-errormessage'] ?? group.ariaErrormessage,
            };
        }
        const isPureCardType = props.type === strings.TYPE_PURECARD;
        return {
            inGroup: false,
            checked: typeof props.checked === 'boolean' ? props.checked : state.checked,
            disabled: Boolean(props.disabled),
            name: props.name,
            isCardType: props.type === strings.TYPE_CARD || isPureCardType,
            isPureCardType,
            ariaInvalid: props['aria-invalid'],
            ariaErrormessage: props['aria-errormessage'],
        };
    }

    /** Whether a click landed on an interactive element inside the root other than the checkbox's own input */
    static isInnerInteractiveClick(target: Element, root: Element, input?: Element | null) {
        const interactive = target.closest(INTERACTIVE_SELECTOR);
        return Boolean(interactive && interactive !== input && root.contains(interactive));
    }

    handleChange(e: CheckboxSourceEvent) {
        const disabled = this.getProp('disabled');

        if (disabled) {
            return;
        }

        this._adapter.focusCheckboxEntity();

        const isInGroup = this._adapter.getIsInGroup();

        if (isInGroup) {
            const groupDisabled = this._adapter.getGroupDisabled();
            if (!groupDisabled) {
                this.#handleChangeInGroup(e);
            }
            return;
        }

        const checked = this.getState('checked');

        const newChecked = !checked;
        if (this._isControlledComponent('checked')) {
            this.#notifyChange(newChecked, e);
        } else {
            this.setChecked(newChecked);
            this.#notifyChange(newChecked, e);
        }
    }

    setChecked(checked: boolean) {
        this._adapter.setChecked(checked);
    }
}

export interface BaseCheckboxProps {
    id?: string;
    autoFocus?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    onChange?: (e: any) => any;
    value?: any;
    style?: Record<string, any>;
    className?: string;
    prefixCls?: string;
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    extra?: any;
    addonId?: string;
    extraId?: string;
    preventScroll?: boolean;
}
