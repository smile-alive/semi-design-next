import type { JSX } from 'solid-js';
import AutoComplete, { type AutoCompleteItems, type AutoCompleteProps } from '../auto-complete';
import Cascader, { type CascaderProps } from '../cascader';
import Checkbox, { type CheckboxProps, CheckboxGroup } from '../checkbox';
import DatePicker from '../date-picker';
import Input, { TextArea } from '../input';
import InputNumber from '../input-number';
import PinCode from '../pincode';
import Radio, { type RadioProps, RadioGroup } from '../radio';
import Rating from '../rating';
import Select, { type BasicSelectValue, type SelectProps } from '../select';
import Slider from '../slider';
import Switch from '../switch';
import TagInput from '../tag-input';
import TimePicker from '../time-picker';
import TreeSelect, { type TreeSelectNodeValue, type TreeSelectProps } from '../tree-select';
import Upload, { type UploadProps } from '../upload';
import type { FieldProps, OptionalFieldProps } from './interface';
import withField, { withTopLabelField } from './with-field';

// `withField` fixes generic type parameters to their constraints; these signatures restore the inference
export type FormSelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> = FieldProps<SelectProps<T, Multiple>>;
type FormSelectComponent = <T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(props: FormSelectProps<T, Multiple>) => JSX.Element;
type FormTreeSelectComponent = <T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>(props: FieldProps<TreeSelectProps<T, Multiple, WithObject>>) => JSX.Element;
type FormCascaderComponent = <Multiple extends boolean | undefined = undefined>(props: FieldProps<CascaderProps<Multiple>>) => JSX.Element;
type FormAutoCompleteComponent = <T extends AutoCompleteItems = AutoCompleteItems>(props: FieldProps<AutoCompleteProps<T>>) => JSX.Element;

export type FormCheckboxProps = OptionalFieldProps<CheckboxProps>;
export type FormRadioProps = OptionalFieldProps<RadioProps>;
export type FormUploadProps = Omit<FieldProps<UploadProps>, 'fileList'>;

export const FormInput = withField(Input);
export const FormInputNumber = withField(InputNumber);
export const FormTextArea = withTopLabelField(TextArea);
// Select collects its children as tokens, so its own Option and OptGroup are reused
export const FormSelect = Object.assign(withField(Select) as unknown as FormSelectComponent, {
    Option: Select.Option,
    OptGroup: Select.OptGroup,
});
export const FormCheckboxGroup = withTopLabelField(CheckboxGroup);
export const FormCheckbox = withTopLabelField(Checkbox, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as unknown as (props: FormCheckboxProps) => JSX.Element;
export const FormRadioGroup = withTopLabelField(RadioGroup, { valuePath: 'target.value' });
export const FormRadio = withTopLabelField(Radio, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as unknown as (props: FormRadioProps) => JSX.Element;
export const FormDatePicker = withField(DatePicker);
export const FormSwitch = withTopLabelField(Switch, { valueKey: 'checked' });
export const FormSlider = withTopLabelField(Slider);
export const FormTimePicker = withField(TimePicker);
export const FormTreeSelect = withField(TreeSelect) as unknown as FormTreeSelectComponent;
export const FormCascader = withField(Cascader) as unknown as FormCascaderComponent;
export const FormRating = withTopLabelField(Rating);
export const FormAutoComplete = withField(AutoComplete) as unknown as FormAutoCompleteComponent;
export const FormUpload = withTopLabelField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
}) as unknown as (props: FormUploadProps) => JSX.Element;
export const FormTagInput = withField(TagInput);
export const FormPinCode = withTopLabelField(PinCode);
