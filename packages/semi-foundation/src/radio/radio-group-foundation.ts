import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { RadioChangeEvent } from './radio-foundation';

export interface RadioGroupAdapter<P extends RadioGroupBaseProps = RadioGroupBaseProps, S extends RadioGroupBaseState = RadioGroupBaseState> extends DefaultAdapter<P, S> {
    notifyChange: (e: RadioChangeEvent) => void;
    setValue: (value: any) => void;
}

/** The props the foundation reads with getProp */
export interface RadioGroupBaseProps {
    mode?: string;
    value?: unknown;
}

export interface RadioGroupBaseState {
    value?: any;
}

export default class RadioGroupFoundation<P extends RadioGroupBaseProps = RadioGroupBaseProps, S extends RadioGroupBaseState = RadioGroupBaseState> extends BaseFoundation<RadioGroupAdapter<P, S>, P, S> {
    handleChange(evt: RadioChangeEvent) {
        const mode = this.getProp('mode');
        const lastValue = this.getState('value');
        const { checked, value } = evt.target;
        const isControlledComponent = this._isControlledComponent();

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
                this._adapter.setValue(undefined);
            } else {
                this._adapter.setValue(value);
            }
        }

        if (mode === 'advanced' || lastValue !== value) {
            this._adapter.notifyChange(cbValue);
        }
    }

    handlePropValueChange(propValue: string | number | boolean) {
        this._adapter.setValue(propValue);
    }
}
