import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { RadioChangeEvent } from './radio-foundation';

export interface RadioGroupAdapter<P extends RadioGroupBaseProps = RadioGroupBaseProps> extends DefaultAdapter<P, RadioGroupBaseState> {
    notifyChange: (e: RadioChangeEvent) => void;
}

export interface RadioGroupBaseProps {
    defaultValue?: unknown;
    mode?: string;
    value?: unknown;
}

export interface RadioGroupBaseState {
    value?: any;
}

export default class RadioGroupFoundation<P extends RadioGroupBaseProps = RadioGroupBaseProps> extends BaseFoundation<RadioGroupAdapter<P>, P, RadioGroupBaseState> {
    static override readonly propKeys = ['value'];

    static getInitialState({ value, defaultValue }: RadioGroupBaseProps): RadioGroupBaseState {
        return { value: value === undefined ? defaultValue : value };
    }

    override handlePropsChange() {
        this.setState({ value: this.getProp('value') });
    }

    handleChange = (evt: RadioChangeEvent) => {
        const mode = this.getProp('mode');
        const lastValue = this.getState('value');
        const { checked, value } = evt.target;
        const isControlledComponent = this.isControlledComponent();

        const cbValue = {
            ...evt,
            target: {
                ...evt.target,
                value,
            },
        };

        if (mode === 'advanced' && !checked) {
            cbValue.target.value = undefined;
        }

        if (!isControlledComponent) {
            if (mode === 'advanced' && !checked) {
                this.setState({ value: undefined });
            } else {
                this.setState({ value });
            }
        }

        if (mode === 'advanced' || lastValue !== value) {
            this.adapter.notifyChange(cbValue);
        }
    };
}
