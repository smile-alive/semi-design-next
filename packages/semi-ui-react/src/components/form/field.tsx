import type React from 'react';
import AutoComplete from '../auto-complete/index';
import Cascader, { type CascaderProps } from '../cascader/index';
import CheckboxGroup from '../checkbox/checkbox-group';
import { Checkbox } from '../checkbox/index';
import DatePicker from '../date-picker/index';
import InputNumber from '../input-number/index';
import Input from '../input/index';
import TextArea from '../input/textarea';
import PinCode from '../pincode/index';
import { Radio } from '../radio/index';
import RadioGroup from '../radio/radio-group';
import Rating from '../rating/index';
import type { BasicSelectValue } from '../select/index';
import SelectOption from '../select/option';
import SelectOptGroup from '../select/option-group';
import Select from '../select/select';
import Slider from '../slider/index';
import Switch from '../switch/index';
import TagInput from '../tag-input/index';
import TimePicker from '../time-picker/index';
import Transfer, { type TransferProps } from '../transfer/index';
import TreeSelect, { type TreeSelectNodeValue, type TreeSelectProps } from '../tree-select/index';
import Upload, { type UploadProps } from '../upload/index';
import type { FieldProps, FormCheckboxProps, FormRadioProps, FormSelectProps } from './interface';
import withField, { withTopLabelField } from './with-field';

// Every field is created by a /* @__PURE__ */ call: without it the bundler cannot drop unused fields, so importing one pulls in all of them

export const FormInput = /* @__PURE__ */ withField(Input);
export const FormInputNumber = /* @__PURE__ */ withField(InputNumber);
export const FormTextArea = /* @__PURE__ */ withTopLabelField(TextArea);

// `withField` fixes generic type parameters to their constraints; these signatures restore the inference
type FormSelectComponent = <T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(props: FormSelectProps<T, Multiple>) => React.ReactElement;
type FormTreeSelectComponent = <T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>(props: FieldProps<TreeSelectProps<T, Multiple, WithObject>>) => React.ReactElement;
type FormCascaderComponent = <Multiple extends boolean | undefined = undefined>(props: FieldProps<CascaderProps<Multiple>>) => React.ReactElement;

// Option and OptGroup are imported as bare identifiers: a property read such as `Select.Option` is kept as a possible side effect
export const FormSelect = /* @__PURE__ */ Object.assign(/* @__PURE__ */ withField(Select) as FormSelectComponent, {
    Option: SelectOption,
    OptGroup: SelectOptGroup,
});

export const FormCheckboxGroup = /* @__PURE__ */ withTopLabelField(CheckboxGroup);
export const FormCheckbox = /* @__PURE__ */ withTopLabelField(Checkbox, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as React.ComponentType<FormCheckboxProps>;
export const FormRadioGroup = /* @__PURE__ */ withTopLabelField(RadioGroup, { valuePath: 'target.value' });
export const FormRadio = /* @__PURE__ */ withTopLabelField(Radio, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as React.ComponentType<FormRadioProps>;

export const FormDatePicker = /* @__PURE__ */ withField(DatePicker);
export const FormSwitch = /* @__PURE__ */ withTopLabelField(Switch, { valueKey: 'checked' });
export const FormSlider = /* @__PURE__ */ withTopLabelField(Slider);
export const FormTimePicker = /* @__PURE__ */ withField(TimePicker);
export const FormTreeSelect = /* @__PURE__ */ withField(TreeSelect) as FormTreeSelectComponent;
export const FormCascader = /* @__PURE__ */ withField(Cascader) as FormCascaderComponent;

// Transfer spreads unknown props onto its root div, so the validateStatus the field injects would reach the DOM
function TransferControl({ validateStatus: _validateStatus, ...props }: TransferProps & { validateStatus?: unknown }) {
    return <Transfer {...props} />;
}

export const FormTransfer = /* @__PURE__ */ withTopLabelField(TransferControl);
export const FormRating = /* @__PURE__ */ withTopLabelField(Rating);
export const FormAutoComplete = /* @__PURE__ */ withField(AutoComplete, { valueKey: 'value', onKeyChangeFnName: 'onChange' });
export const FormUpload = /* @__PURE__ */ withTopLabelField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
    onKeyChangeFnName: 'onChange',
}) as React.ComponentType<Omit<FieldProps<UploadProps>, 'fileList'>>;
export const FormTagInput = /* @__PURE__ */ withField(TagInput);
export const FormPinCode = /* @__PURE__ */ withTopLabelField(PinCode);
