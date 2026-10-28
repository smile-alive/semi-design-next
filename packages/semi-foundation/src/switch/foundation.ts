import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

/** E is the host's change event, which the foundation only passes through */
export interface SwitchAdapter<P extends SwitchBaseProps = SwitchBaseProps, S extends SwitchState = SwitchState, E = unknown> extends DefaultAdapter<P, S> {
    setChecked: (checked?: boolean) => void;
    notifyChange: (checked: boolean, e: E) => void;
}

interface SwitchCheckedProps {
    checked?: boolean;
    defaultChecked?: boolean;
}

export interface SwitchState {
    checked?: boolean;
}

/** The props the foundation reads with getProps */
export interface SwitchBaseProps extends SwitchCheckedProps {
    loading?: boolean;
}

export default class SwitchFoundation<P extends SwitchBaseProps = SwitchBaseProps, S extends SwitchState = SwitchState, E = unknown> extends BaseFoundation<SwitchAdapter<P, S, E>, P, S> {
    static getInitialState(props: SwitchCheckedProps): SwitchState {
        return {
            checked: props.checked ?? props.defaultChecked,
        };
    }

    // a controlled `checked` wins on the render it arrives in; state catches up after commit
    static deriveChecked(props: SwitchCheckedProps, state: Pick<SwitchState, 'checked'>) {
        return Boolean(props.checked !== undefined ? props.checked : state.checked);
    }

    // mirrors `checked`, so a form reset to undefined leaves the switch unchecked
    setChecked(checked?: boolean) {
        this._adapter.setChecked(checked);
    }

    handleChange(checked: boolean, e: E) {
        if (this.getProp('loading')) {
            return;
        }
        if (!this._isControlledComponent('checked')) {
            this.setChecked(checked);
        }
        this._adapter.notifyChange(checked, e);
    }
}
