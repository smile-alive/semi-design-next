import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { crossesFocusBoundary } from '../../utils/a11y';
import type { RadioChangeEvent } from './radio-foundation';

export interface RadioGroupAdapter<P extends RadioGroupBaseProps = RadioGroupBaseProps> extends DefaultAdapter<P, RadioGroupBaseState> {
    notifyChange: (e: RadioChangeEvent) => void;
    /** Form injects `onBlur` into the group */
    notifyBlur: (e: any) => void;
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

    static deriveValue({ value }: RadioGroupBaseProps, state: RadioGroupBaseState) {
        return value === undefined ? state.value : value;
    }

    override handlePropsChange() {
        this.setState({ value: this.getProp('value') });
    }

    // moving between the radios is not leaving the group: Form's blur validation waits until focus is outside
    handleBlur = (e: Parameters<typeof crossesFocusBoundary>[0]) => {
        if (crossesFocusBoundary(e)) {
            this.adapter.notifyBlur(e);
        }
    };

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
