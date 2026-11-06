import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import warning from '../utils/warning';
import type { BasicCheckboxEvent } from './checkbox-foundation';

export type CheckboxValue = string | number | boolean;

export interface CheckboxGroupBaseProps {
    defaultValue?: CheckboxValue[];
    value?: CheckboxValue[];
}

export interface CheckboxGroupBaseState {
    value: CheckboxValue[];
}

export interface CheckboxGroupAdapter<P extends CheckboxGroupBaseProps = CheckboxGroupBaseProps> extends DefaultAdapter<P, CheckboxGroupBaseState> {
    notifyChange: (value: CheckboxValue[]) => void;
}

export default class CheckboxGroupFoundation<P extends CheckboxGroupBaseProps = CheckboxGroupBaseProps> extends BaseFoundation<CheckboxGroupAdapter<P>, P, CheckboxGroupBaseState> {
    // Tree and TreeSelect pass a new array on every render
    static override readonly propKeys = ['value'];
    static override readonly propEquals = { value: isEqual };

    protected override initOnce() {
        const { defaultValue, value } = this.getProps();
        if (typeof defaultValue !== 'undefined' && !Array.isArray(defaultValue)) {
            warning(true, 'Warning: [Semi CheckboxGroup] defaultValue should be an Array');
        }

        if (typeof value !== 'undefined' && !Array.isArray(value)) {
            warning(true, 'Warning: [Semi CheckboxGroup] value should be an Array');
        }
    }

    static getInitialState({ value, defaultValue }: CheckboxGroupBaseProps): CheckboxGroupBaseState {
        return { value: value || defaultValue || [] };
    }

    // a non-array `value` is ignored, so the group keeps its last valid value
    static deriveValue(props: CheckboxGroupBaseProps, state: CheckboxGroupBaseState) {
        return Array.isArray(props.value) ? props.value : state.value;
    }

    // a value that goes back to undefined (a form reset) empties the group
    override handlePropsChange() {
        const value = this.getProp('value');
        if (Array.isArray(value)) {
            this.setState({ value });
        } else if (value === undefined) {
            this.setState({ value: [] });
        } else {
            warning(true, 'Warning: [Semi CheckboxGroup] value should be an Array');
        }
    }

    handleChange = (evt: BasicCheckboxEvent) => {
        const prevValue = CheckboxGroupFoundation.deriveValue(this.getProps(), this.getStates());
        const { checked, value } = evt.target;
        const newValue = checked ? [...prevValue, value] : prevValue.filter((item) => item !== value);

        if (!this.isControlledComponent()) {
            this.setState({ value: newValue });
        }
        this.adapter.notifyChange(newValue);
    };
}
