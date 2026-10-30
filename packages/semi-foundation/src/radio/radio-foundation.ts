import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from './constants';

export interface RadioChangeEvent {
    target: {
        [x: string]: any;
        checked: boolean;
        value: any;
    };
    stopPropagation: () => void;
    preventDefault: () => void;
}

/** What a radio reads from the enclosing RadioGroup */
export interface RadioGroupView {
    value?: unknown;
    disabled?: boolean;
    name?: string;
    prefixCls?: string;
    buttonSize?: string;
    isButtonRadio?: boolean;
    isCardRadio?: boolean;
    isPureCardRadio?: boolean;
    onChange?: (e: RadioChangeEvent) => void;
}

export interface RadioContextView {
    mode?: string;
    radioGroup?: RadioGroupView;
}

/** The props the foundation reads with getProps */
export interface RadioBaseProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    mode?: string;
    name?: string;
    prefixCls?: string;
    type?: string;
    value?: unknown;
}

export interface RadioBaseState {
    checked?: boolean;
}

export interface RadioAdapter<P extends RadioBaseProps = RadioBaseProps, S extends RadioBaseState = RadioBaseState> extends DefaultAdapter<P, S, RadioContextView | null | undefined> {
    setChecked: (checked: boolean) => void;
    notifyGroupChange: (e: RadioChangeEvent) => void;
    notifyChange: (e: RadioChangeEvent) => void;
    getInput: () => HTMLInputElement | null;
}

export interface RadioView {
    inGroup: boolean;
    checked: boolean;
    disabled: boolean;
    mode: string;
    isButtonRadio: boolean;
    isCardRadio: boolean;
    isPureCardRadio: boolean;
    buttonSize?: string;
    prefixCls?: string;
}

/** The part of the native event the foundation forwards */
interface RadioSourceEvent {
    stopPropagation: () => void;
    preventDefault: () => void;
}

export default class RadioFoundation<P extends RadioBaseProps = RadioBaseProps, S extends RadioBaseState = RadioBaseState> extends BaseFoundation<RadioAdapter<P, S>, P, S> {
    // Radios outside a group that keep their own state: the native input unchecks its same-name peers, but their
    // state would still say checked
    static #standalone = new Set<RadioFoundation<any, any>>();

    #getView() {
        return RadioFoundation.deriveView(this.getProps(), this.getStates(), this.getContexts());
    }

    #isStandalone() {
        return !this.getContexts()?.radioGroup && !this._isControlledComponent('checked');
    }

    /** Unchecks, without notifying, the standalone radios that share this one's native group (same form and name) */
    #uncheckPeers() {
        const input = this._adapter.getInput();
        if (!input?.name || !this.#isStandalone()) {
            return;
        }
        for (const peer of RadioFoundation.#standalone) {
            const peerInput = peer._adapter.getInput();
            if (peer !== this && peer.#isStandalone() && peerInput?.name === input.name && peerInput.form === input.form && peerInput.getRootNode() === input.getRootNode() && peer.getState('checked')) {
                peer.setChecked(false);
            }
        }
    }

    // a boolean `checked` is controlled and `defaultChecked` only seeds the uncontrolled state
    static getInitialState(props: Pick<RadioBaseProps, 'checked' | 'defaultChecked'>): RadioBaseState {
        return { checked: typeof props.checked === 'boolean' ? props.checked : Boolean(props.defaultChecked) };
    }

    /** How the radio looks and behaves, from its own props or, inside a group, from the group */
    static deriveView(props: RadioBaseProps, state: RadioBaseState, context?: RadioContextView | null): RadioView {
        const group = context?.radioGroup;
        if (group) {
            return {
                inGroup: true,
                checked: props.value !== undefined && group.value === props.value,
                disabled: Boolean(props.disabled || group.disabled),
                mode: context.mode,
                isButtonRadio: Boolean(group.isButtonRadio),
                isCardRadio: Boolean(group.isCardRadio),
                isPureCardRadio: Boolean(group.isPureCardRadio),
                buttonSize: group.buttonSize,
                prefixCls: props.prefixCls || group.prefixCls,
            };
        }
        const isPureCardRadio = props.type === strings.TYPE_PURECARD;
        return {
            inGroup: false,
            checked: typeof props.checked === 'boolean' ? props.checked : Boolean(state.checked),
            disabled: Boolean(props.disabled),
            mode: props.mode,
            isButtonRadio: props.type === strings.TYPE_BUTTON,
            isCardRadio: props.type === strings.TYPE_CARD || isPureCardRadio,
            isPureCardRadio,
            buttonSize: undefined,
            prefixCls: props.prefixCls,
        };
    }

    override init() {
        RadioFoundation.#standalone.add(this);
    }

    override destroy() {
        RadioFoundation.#standalone.delete(this);
    }

    setChecked = (checked: boolean) => {
        this._adapter.setChecked(checked);
    };

    /** `checked` is the value the native input reports, or false for the uncheck of advanced mode */
    handleChange = (checked: boolean, e: RadioSourceEvent) => {
        const props = this.getProps();
        const group = this.getContexts()?.radioGroup;
        const event: RadioChangeEvent = {
            target: {
                ...props,
                name: props.name ?? group?.name,
                disabled: this.#getView().disabled,
                value: props.value,
                checked,
            },
            stopPropagation: () => e.stopPropagation(),
            preventDefault: () => e.preventDefault(),
        };
        this._adapter.notifyGroupChange(event);
        if (!this._isControlledComponent('checked')) {
            if (checked) {
                this.#uncheckPeers();
            }
            this.setChecked(checked);
        }
        this._adapter.notifyChange(event);
    };

    // a native radio reports no change when the checked one is clicked, so advanced mode reports the uncheck here
    handleClick = (e: RadioSourceEvent) => {
        const { checked, mode } = this.#getView();
        if (mode === 'advanced' && checked) {
            this.handleChange(false, e);
        }
    };

    // Chrome sends no click for Space on a checked radio, so the keyboard uncheck of advanced mode is reported here;
    // preventDefault stops the activation that follows keyup from checking the radio again
    handleKeyUp = (e: RadioSourceEvent & { key: string }) => {
        const { checked, mode } = this.#getView();
        if (e.key === ' ' && mode === 'advanced' && checked) {
            e.preventDefault();
            this.handleChange(false, e);
        }
    };
}
