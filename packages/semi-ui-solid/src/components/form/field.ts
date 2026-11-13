import { type JSX, createComponent, splitProps } from 'solid-js';
import AutoComplete, { type AutoCompleteItems, type AutoCompleteProps } from '../auto-complete';
import Cascader, { type CascaderProps } from '../cascader';
import Checkbox, { type CheckboxProps, CheckboxGroup } from '../checkbox';
import DatePicker from '../date-picker';
import Input, { TextArea } from '../input';
import InputNumber from '../input-number';
import PinCode from '../pincode';
import Radio, { type RadioProps, RadioGroup } from '../radio';
import Rating from '../rating';
import type { BasicSelectValue, SelectProps } from '../select';
import SelectOption from '../select/option';
import SelectOptGroup from '../select/option-group';
import Select from '../select/select';
import Slider from '../slider';
import Switch from '../switch';
import TagInput from '../tag-input';
import TimePicker from '../time-picker';
import Transfer, { type TransferProps } from '../transfer';
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

// Every field is created by a /* @__PURE__ */ call: without it the bundler cannot drop unused fields, so importing one pulls in all of them
export const FormInput = /* @__PURE__ */ withField(Input);
export const FormInputNumber = /* @__PURE__ */ withField(InputNumber);
export const FormTextArea = /* @__PURE__ */ withTopLabelField(TextArea);
// Select collects its children as tokens, so its own Option and OptGroup are reused; they are bare identifiers because a property read such as `Select.Option` is kept as a possible side effect
export const FormSelect = /* @__PURE__ */ Object.assign(/* @__PURE__ */ withField(Select) as FormSelectComponent, {
    Option: SelectOption,
    OptGroup: SelectOptGroup,
});
export const FormCheckboxGroup = /* @__PURE__ */ withTopLabelField(CheckboxGroup);
export const FormCheckbox = /* @__PURE__ */ withTopLabelField(Checkbox, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as (props: FormCheckboxProps) => JSX.Element;
export const FormRadioGroup = /* @__PURE__ */ withTopLabelField(RadioGroup, { valuePath: 'target.value' });
export const FormRadio = /* @__PURE__ */ withTopLabelField(Radio, {
    valueKey: 'checked',
    valuePath: 'target.checked',
    shouldInject: false,
}) as (props: FormRadioProps) => JSX.Element;
export const FormDatePicker = /* @__PURE__ */ withField(DatePicker);
export const FormSwitch = /* @__PURE__ */ withTopLabelField(Switch, { valueKey: 'checked' });
export const FormSlider = /* @__PURE__ */ withTopLabelField(Slider);
export const FormTimePicker = /* @__PURE__ */ withField(TimePicker);
export const FormTreeSelect = /* @__PURE__ */ withField(TreeSelect) as FormTreeSelectComponent;
export const FormCascader = /* @__PURE__ */ withField(Cascader) as FormCascaderComponent;

// Transfer spreads unknown props onto its root div, so the validateStatus the field injects would reach the DOM
function TransferControl(props: TransferProps & { validateStatus?: unknown }) {
    const [, rest] = splitProps(props, ['validateStatus']);
    return createComponent(Transfer, rest);
}

export const FormTransfer = /* @__PURE__ */ withTopLabelField(TransferControl);
export const FormRating = /* @__PURE__ */ withTopLabelField(Rating);
export const FormAutoComplete = /* @__PURE__ */ withField(AutoComplete) as FormAutoCompleteComponent;
export const FormUpload = /* @__PURE__ */ withTopLabelField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
}) as (props: FormUploadProps) => JSX.Element;
export const FormTagInput = /* @__PURE__ */ withField(TagInput);
export const FormPinCode = /* @__PURE__ */ withTopLabelField(PinCode);
