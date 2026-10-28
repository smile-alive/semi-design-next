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
import Select, { type BasicSelectValue } from '../select/index';
import Slider from '../slider/index';
import Switch from '../switch/index';
import TagInput from '../tag-input/index';
import TimePicker from '../time-picker/index';
import TreeSelect, { type TreeSelectNodeValue, type TreeSelectProps } from '../tree-select/index';
import Upload, { type UploadProps } from '../upload/index';
import withField, { withTopLabelField } from './hoc/with-field';
import type { FieldProps, FormCheckboxProps, FormRadioProps, FormSelectProps } from './interface';

export const FormInput = withField(Input);
export const FormInputNumber = withField(InputNumber);
export const FormTextArea = withTopLabelField(TextArea);

// `withField` fixes generic type parameters to their constraints; these signatures restore the inference
type FormSelectComponent = <T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(props: FormSelectProps<T, Multiple>) => React.ReactElement;
type FormTreeSelectComponent = <T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>(props: FieldProps<TreeSelectProps<T, Multiple, WithObject>>) => React.ReactElement;
type FormCascaderComponent = <Multiple extends boolean | undefined = undefined>(props: FieldProps<CascaderProps<Multiple>>) => React.ReactElement;

export const FormSelect = Object.assign(withField(Select) as FormSelectComponent, {
    Option: Select.Option,
    OptGroup: Select.OptGroup,
});

export const FormCheckboxGroup = withTopLabelField(CheckboxGroup);
export const FormCheckbox = withTopLabelField(Checkbox, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as React.ComponentType<FormCheckboxProps>;
export const FormRadioGroup = withTopLabelField(RadioGroup, { valuePath: 'target.value' });
export const FormRadio = withTopLabelField(Radio, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as React.ComponentType<FormRadioProps>;

export const FormDatePicker = withField(DatePicker);
export const FormSwitch = withTopLabelField(Switch, { valueKey: 'checked' });
export const FormSlider = withTopLabelField(Slider);
export const FormTimePicker = withField(TimePicker);
export const FormTreeSelect = withField(TreeSelect) as FormTreeSelectComponent;
export const FormCascader = withField(Cascader) as FormCascaderComponent;
export const FormRating = withTopLabelField(Rating);
export const FormAutoComplete = withField(AutoComplete, { valueKey: 'value', onKeyChangeFnName: 'onChange' });
export const FormUpload = withTopLabelField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
    onKeyChangeFnName: 'onChange',
}) as React.ComponentType<Omit<FieldProps<UploadProps>, 'fileList'>>;
export const FormTagInput = withField(TagInput);
export const FormPinCode = withTopLabelField(PinCode);
