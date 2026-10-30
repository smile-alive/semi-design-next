import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import warning from '../utils/warning';
import type { BasicCheckboxEvent } from './checkbox-foundation';

export type CheckboxValue = string | number | boolean;

/** The props the foundation reads with getProps */
export interface CheckboxGroupBaseProps {
    defaultValue?: CheckboxValue[];
    value?: CheckboxValue[];
}

export interface CheckboxGroupBaseState {
    value?: CheckboxValue[];
}

export interface CheckboxGroupAdapter<P extends CheckboxGroupBaseProps = CheckboxGroupBaseProps, S extends CheckboxGroupBaseState = CheckboxGroupBaseState> extends DefaultAdapter<P, S> {
    updateGroupValue: (value: CheckboxValue[]) => void;
    notifyChange: (value: CheckboxValue[]) => void;
}
export default class CheckboxGroupFoundation<P extends CheckboxGroupBaseProps = CheckboxGroupBaseProps, S extends CheckboxGroupBaseState = CheckboxGroupBaseState> extends BaseFoundation<CheckboxGroupAdapter<P, S>, P, S> {
    // a non-array `value` is ignored, so the group keeps its last valid value
    static deriveValue(props: CheckboxGroupBaseProps, state: CheckboxGroupBaseState) {
        return Array.isArray(props.value) ? props.value : state.value;
    }

    override init() {
        const { defaultValue, value } = this.getProps();
        if (typeof defaultValue !== 'undefined' && !Array.isArray(defaultValue)) {
            warning(true, 'Warning: [Semi CheckboxGroup] defaultValue should be an Array');
        }

        if (typeof value !== 'undefined' && !Array.isArray(value)) {
            warning(true, 'Warning: [Semi CheckboxGroup] value should be an Array');
        }
    }

    handleChange = (evt: BasicCheckboxEvent) => {
        const prevValue = CheckboxGroupFoundation.deriveValue(this.getProps(), this.getStates());
        const { checked, value } = evt.target;
        const newValue = checked ? [...prevValue, value] : prevValue.filter((item) => item !== value);

        if (!this.isControlledComponent()) {
            this.adapter.updateGroupValue(newValue);
        }
        this.adapter.notifyChange(newValue);
    };

    handlePropValueChange = (newPropValue: unknown) => {
        if (Array.isArray(newPropValue)) {
            this.adapter.updateGroupValue(newPropValue);
        } else {
            // Form.CheckboxGroup reset
            if (typeof newPropValue === 'undefined') {
                this.adapter.updateGroupValue([]);
            }
            warning(true, 'Warning: [Semi CheckboxGroup] value should be an Array');
        }
    };
}
