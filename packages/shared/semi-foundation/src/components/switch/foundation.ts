import { BaseFoundation, type DefaultAdapter } from '../../base/index';

/** E is the host's change event, which the foundation only passes through */
export interface SwitchAdapter<P extends SwitchBaseProps = SwitchBaseProps, E = unknown> extends DefaultAdapter<P, SwitchState> {
    notifyChange: (checked: boolean, e: E) => void;
}

interface SwitchCheckedProps {
    checked?: boolean;
    defaultChecked?: boolean;
}

export interface SwitchState {
    checked: boolean;
}

export interface SwitchBaseProps extends SwitchCheckedProps {
    loading?: boolean;
}

export default class SwitchFoundation<P extends SwitchBaseProps = SwitchBaseProps, E = unknown> extends BaseFoundation<SwitchAdapter<P, E>, P, SwitchState> {
    static override readonly propKeys = ['checked'];

    static getInitialState(props: SwitchCheckedProps): SwitchState {
        return {
            checked: props.checked !== undefined ? Boolean(props.checked) : Boolean(props.defaultChecked),
        };
    }

    // a controlled `checked` wins on the render it arrives in; state catches up after commit
    static deriveChecked(props: SwitchCheckedProps, state: Pick<SwitchState, 'checked'>) {
        return Boolean(props.checked !== undefined ? props.checked : state.checked);
    }

    // state mirrors `checked`, so a form reset to undefined leaves the switch unchecked
    override handlePropsChange() {
        this.setState({ checked: Boolean(this.getProp('checked')) });
    }

    handleChange = (checked: boolean, e: E) => {
        if (this.getProp('loading')) {
            return;
        }
        if (!this.isControlledComponent('checked')) {
            this.setState({ checked });
        }
        this.adapter.notifyChange(checked, e);
    };
}
