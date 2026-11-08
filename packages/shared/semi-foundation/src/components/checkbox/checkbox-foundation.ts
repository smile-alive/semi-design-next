import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import type { CheckboxValue } from './checkbox-group-foundation';
import { strings } from './constants';

/** `checked` is the new state; `name` and `disabled` are the resolved values, group included */
export interface BasicTargetObject {
    checked: boolean;
    value: CheckboxValue | undefined;
    name: string | undefined;
    disabled: boolean;
}
export interface BasicCheckboxEvent {
    target: BasicTargetObject;
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent: {
        stopImmediatePropagation: () => void;
    };
}

export interface CheckboxSourceEvent {
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent?: { stopImmediatePropagation?: () => void };
}
/** The host's context: `checkboxGroup` is set inside a CheckboxGroup */
export interface CheckboxContextView {
    checkboxGroup?: CheckboxGroupView;
}

export interface CheckboxAdapter<P extends BaseCheckboxProps = BaseCheckboxProps> extends DefaultAdapter<P, CheckboxBaseState, CheckboxContextView | null | undefined> {
    notifyGroupChange: (e: BasicCheckboxEvent) => void;
    notifyChange: (e: BasicCheckboxEvent) => void;
    focusCheckboxEntity: () => void;
}

export interface CheckboxBaseState {
    checked: boolean;
}

type AriaInvalid = boolean | 'true' | 'false' | 'grammar' | 'spelling';

export interface CheckboxGroupView {
    value: CheckboxValue[];
    disabled: boolean;
    name: string;
    isCardType: boolean;
    isPureCardType: boolean;
    ariaInvalid?: AriaInvalid;
    ariaErrormessage?: string;
    /** For a host whose adapter reaches the group through the context */
    onChange?: (e: BasicCheckboxEvent) => void;
}

/** `checked` is the controlled value */
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

export default class CheckboxFoundation<P extends BaseCheckboxProps = BaseCheckboxProps> extends BaseFoundation<CheckboxAdapter<P>, P, CheckboxBaseState> {
    static override readonly propKeys = ['checked'];

    #getView() {
        return CheckboxFoundation.deriveView(this.getProps(), this.getStates(), this.getContexts()?.checkboxGroup);
    }

    #createEvent(checked: boolean, view: CheckboxView, e: CheckboxSourceEvent): BasicCheckboxEvent {
        return {
            target: { checked, value: this.getProp('value'), name: view.name, disabled: view.disabled },
            stopPropagation: () => e.stopPropagation(),
            preventDefault: () => e.preventDefault(),
            // React hands the synthetic event, which carries the native one; the other hosts hand the native event
            nativeEvent: (e.nativeEvent ?? e) as BasicCheckboxEvent['nativeEvent'],
        };
    }

    // `checked` is controlled whenever it is not undefined, so null reads as unchecked
    static getInitialState(props: Pick<CheckboxViewProps, 'checked'> & Pick<BaseCheckboxProps, 'defaultChecked'>): CheckboxBaseState {
        return { checked: props.checked !== undefined ? Boolean(props.checked) : Boolean(props.defaultChecked) };
    }

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
            checked: props.checked !== undefined ? Boolean(props.checked) : state.checked,
            disabled: Boolean(props.disabled),
            name: props.name,
            isCardType: props.type === strings.TYPE_CARD || isPureCardType,
            isPureCardType,
            ariaInvalid: props['aria-invalid'],
            ariaErrormessage: props['aria-errormessage'],
        };
    }

    static isInnerInteractiveClick(target: Element, root: Element, input?: Element | null) {
        const interactive = target.closest(INTERACTIVE_SELECTOR);
        return Boolean(interactive && interactive !== input && root.contains(interactive));
    }

    // state mirrors `checked`, so a form reset to undefined leaves the box unchecked
    override handlePropsChange() {
        this.setState({ checked: Boolean(this.getProp('checked')) });
    }

    handleChange = (e: CheckboxSourceEvent) => {
        const disabled = this.getProp('disabled');

        if (disabled) {
            return;
        }

        this.adapter.focusCheckboxEntity();

        const view = this.#getView();

        if (view.inGroup) {
            if (!view.disabled) {
                const event = this.#createEvent(!view.checked, view, e);
                this.adapter.notifyChange(event);
                this.adapter.notifyGroupChange(event);
            }
            return;
        }

        const newChecked = !this.getState('checked');
        if (!this.isControlledComponent('checked')) {
            this.setState({ checked: newChecked });
        }
        this.adapter.notifyChange(this.#createEvent(newChecked, view, e));
    };
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
    name?: string;
    type?: (typeof strings)['TYPE_DEFAULT' | 'TYPE_CARD' | 'TYPE_PURECARD'];
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
