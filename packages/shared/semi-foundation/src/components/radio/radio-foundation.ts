import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { strings } from './constants';

export interface RadioChangeEvent {
    /** `checked` is the new state; `name` and `disabled` are the resolved values, group included */
    target: {
        checked: boolean;
        value?: any;
        name?: string;
        disabled: boolean;
    };
    stopPropagation: () => void;
    preventDefault: () => void;
}

export interface RadioGroupView {
    value?: unknown;
    disabled?: boolean;
    name?: string;
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

export interface RadioBaseProps {
    checked?: boolean | null;
    defaultChecked?: boolean;
    disabled?: boolean;
    mode?: string;
    name?: string;
    type?: string;
    value?: unknown;
}

export interface RadioBaseState {
    checked: boolean;
}

export interface RadioAdapter<P extends RadioBaseProps = RadioBaseProps> extends DefaultAdapter<P, RadioBaseState, RadioContextView | null | undefined> {
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
}

interface RadioSourceEvent {
    stopPropagation: () => void;
    preventDefault: () => void;
}

export default class RadioFoundation<P extends RadioBaseProps = RadioBaseProps> extends BaseFoundation<RadioAdapter<P>, P, RadioBaseState> {
    // Radios outside a group that keep their own state: the native input unchecks its same-name peers, but their
    // state would still say checked
    static #standalone = new Set<RadioFoundation<any>>();
    static override readonly propKeys = ['checked'];

    #getView() {
        return RadioFoundation.deriveView(this.getProps(), this.getStates(), this.getContexts());
    }

    #isStandalone() {
        return !this.getContexts()?.radioGroup && !this.isControlledComponent('checked');
    }

    /** Unchecks, without notifying, the standalone radios that share this one's native group (same form and name) */
    #uncheckPeers() {
        const input = this.adapter.getInput();
        if (!input?.name || !this.#isStandalone()) {
            return;
        }
        for (const peer of RadioFoundation.#standalone) {
            const peerInput = peer.adapter.getInput();
            if (peer !== this && peer.#isStandalone() && peerInput?.name === input.name && peerInput.form === input.form && peerInput.getRootNode() === input.getRootNode() && peer.getState('checked')) {
                peer.setState({ checked: false });
            }
        }
    }

    // `checked` is controlled whenever it is not undefined, so null reads as unchecked; `defaultChecked` only seeds the uncontrolled state
    static getInitialState(props: Pick<RadioBaseProps, 'checked' | 'defaultChecked'>): RadioBaseState {
        return { checked: props.checked !== undefined ? Boolean(props.checked) : Boolean(props.defaultChecked) };
    }

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
            };
        }
        const isPureCardRadio = props.type === strings.TYPE_PURECARD;
        return {
            inGroup: false,
            checked: props.checked !== undefined ? Boolean(props.checked) : Boolean(state.checked),
            disabled: Boolean(props.disabled),
            mode: props.mode,
            isButtonRadio: props.type === strings.TYPE_BUTTON,
            isCardRadio: props.type === strings.TYPE_CARD || isPureCardRadio,
            isPureCardRadio,
            buttonSize: undefined,
        };
    }

    override init() {
        RadioFoundation.#standalone.add(this);
    }

    override destroy() {
        RadioFoundation.#standalone.delete(this);
    }

    // state mirrors `checked`, so a form reset to undefined unchecks the radio
    override handlePropsChange() {
        this.setState({ checked: Boolean(this.getProp('checked')) });
    }

    /** `checked` is the value the native input reports, or false for the uncheck of advanced mode */
    handleChange = (checked: boolean, e: RadioSourceEvent) => {
        const props = this.getProps();
        const event: RadioChangeEvent = {
            target: {
                checked,
                value: props.value,
                name: this.getContexts()?.radioGroup?.name ?? props.name,
                disabled: this.#getView().disabled,
            },
            stopPropagation: () => e.stopPropagation(),
            preventDefault: () => e.preventDefault(),
        };
        this.adapter.notifyGroupChange(event);
        if (!this.isControlledComponent('checked')) {
            if (checked) {
                this.#uncheckPeers();
            }
            this.setState({ checked });
        }
        this.adapter.notifyChange(event);
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
