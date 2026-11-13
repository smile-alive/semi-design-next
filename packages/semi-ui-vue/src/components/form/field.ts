import type { ComponentPublicInstance, VNode } from 'vue';
import type { ExclusiveFieldValidation } from '@fibrae/semi-foundation/components/form/interface';
import type { ElementProps, EmitHandlers, EmitProps } from '../../base/index';
import AutoComplete, { type AutoCompleteEmits, type AutoCompleteHandle, type AutoCompleteItems, type AutoCompleteProps, type AutoCompleteSlots } from '../auto-complete';
import Cascader, { type CascaderEmits, type CascaderHandle, type CascaderProps, type CascaderSlots } from '../cascader';
import Checkbox, { CheckboxGroup } from '../checkbox';
import DatePicker, { type DatePickerEmits, type DatePickerHandle, type DatePickerProps, type DatePickerSlots, type DatePickerType } from '../date-picker';
import Input, { TextArea } from '../input';
import InputNumber from '../input-number';
import PinCode from '../pincode';
import Radio, { type RadioGroupEmits, type RadioGroupProps, type RadioGroupSlots, type RadioValue, RadioGroup } from '../radio';
import Rating from '../rating';
import type { BasicSelectValue, SelectEmits, SelectHandle, SelectOptGroup, SelectOption, SelectProps, SelectSlots } from '../select';
import SelectOptGroupComponent from '../select/option-group.vue';
import SelectOptionComponent from '../select/option.vue';
import Select from '../select/select.vue';
import Slider from '../slider';
import Switch from '../switch';
import TagInput from '../tag-input';
import TimePicker from '../time-picker';
import Transfer from '../transfer';
import TreeSelect, { type TreeSelectEmits, type TreeSelectHandle, type TreeSelectProps, type TreeSelectSlots, type TreeSelectValue } from '../tree-select';
import Upload from '../upload';
import type { FieldComponent, FieldHandle, FieldProps, FieldShellSlots } from './interface';
import withField from './with-field';

/** A generic field's call-site props: the component's own props, its emit handlers and the native attributes of its root div */
type CallSiteProps<P, E> = P & EmitProps<E> & ElementProps<'div', keyof P | EmitHandlers<E>>;

type FieldSlots<S> = Omit<S, 'insetLabel'> & FieldShellSlots;

interface GenericFieldContext<S> {
    attrs: Record<string, unknown>;
    slots: FieldSlots<S>;
    emit: unknown;
}

// withField sees a generic SFC through its call signature, which fixes type parameters to their constraints; these
// signatures mimic vue-tsc's generic SFC shape so templates infer `multiple` and the change payload
type GenericFieldNode<P, S, H> = VNode & {
    __ctx?: GenericFieldContext<S> & { props: P; expose: (exposed: FieldHandle<H>) => void };
};

export type FormSelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> = FieldProps<CallSiteProps<SelectProps<T, Multiple>, SelectEmits<T, Multiple>>>;

type FormSelectComponent = <T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(props: FormSelectProps<T, Multiple>, ctx?: GenericFieldContext<SelectSlots>) => GenericFieldNode<FormSelectProps<T, Multiple>, SelectSlots, SelectHandle>;

type FormTreeSelectProps<T, Multiple extends boolean | undefined> = FieldProps<CallSiteProps<TreeSelectProps<T, Multiple>, TreeSelectEmits<T, Multiple>>>;

type FormTreeSelectComponent = <T = TreeSelectValue, Multiple extends boolean | undefined = undefined>(props: FormTreeSelectProps<T, Multiple>, ctx?: GenericFieldContext<TreeSelectSlots<T, Multiple>>) => GenericFieldNode<FormTreeSelectProps<T, Multiple>, TreeSelectSlots<T, Multiple>, TreeSelectHandle>;

type FormCascaderProps<Multiple extends boolean | undefined> = FieldProps<CallSiteProps<CascaderProps<Multiple>, CascaderEmits<Multiple>>>;

type FormCascaderComponent = <Multiple extends boolean | undefined = undefined>(props: FormCascaderProps<Multiple>, ctx?: GenericFieldContext<CascaderSlots<Multiple>>) => GenericFieldNode<FormCascaderProps<Multiple>, CascaderSlots<Multiple>, CascaderHandle>;

type FormDatePickerProps<Kind extends DatePickerType | undefined, Multiple extends boolean | undefined> = FieldProps<CallSiteProps<DatePickerProps<Kind, Multiple>, DatePickerEmits<Kind, Multiple>>>;

type FormDatePickerComponent = <Kind extends DatePickerType | undefined = undefined, Multiple extends boolean | undefined = undefined>(props: FormDatePickerProps<Kind, Multiple>, ctx?: GenericFieldContext<DatePickerSlots>) => GenericFieldNode<FormDatePickerProps<Kind, Multiple>, DatePickerSlots, DatePickerHandle>;

type FormAutoCompleteProps<T extends AutoCompleteItems> = FieldProps<CallSiteProps<AutoCompleteProps<T>, AutoCompleteEmits>>;

type FormAutoCompleteComponent = <T extends AutoCompleteItems = AutoCompleteItems>(props: FormAutoCompleteProps<T>, ctx?: GenericFieldContext<AutoCompleteSlots<T>>) => GenericFieldNode<FormAutoCompleteProps<T>, AutoCompleteSlots<T>, AutoCompleteHandle>;

type FormRadioGroupProps<T extends RadioValue> = FieldProps<CallSiteProps<RadioGroupProps<T>, RadioGroupEmits<T>>>;

type FormRadioGroupComponent = <T extends RadioValue = RadioValue>(props: FormRadioGroupProps<T>, ctx?: GenericFieldContext<RadioGroupSlots>) => GenericFieldNode<FormRadioGroupProps<T>, RadioGroupSlots, ComponentPublicInstance>;

type OptionalLatestValues<P> = P extends { onChange?: (event: infer E, latestValues: infer L) => infer R } ? (event: E, latestValues?: L) => R : never;

type FieldPropsOf<C> = InstanceType<FieldComponent<C>>['$props'];

// Without `field` it renders as the bare control, as inside its group, whose change carries no latest values. The
// change is not split into one signature per case: a template types its listener from the props' onChange alone, so a
// union of the two would leave the listener's parameters untyped.
type OptionalFieldComponent<C> = new () => Omit<InstanceType<FieldComponent<C>>, '$props'> & {
    $props: Omit<FieldPropsOf<C>, 'field' | 'onChange'> & ExclusiveFieldValidation & { field?: string; onChange?: OptionalLatestValues<FieldPropsOf<C>> };
};

// Every field is created by a /* @__PURE__ */ call: without it the bundler cannot drop unused fields, so importing one pulls in all of them
export const FormInput: FieldComponent<typeof Input> = /* @__PURE__ */ withField(Input);
export const FormInputNumber: FieldComponent<typeof InputNumber> = /* @__PURE__ */ withField(InputNumber);
export const FormTextArea: FieldComponent<typeof TextArea> = /* @__PURE__ */ withField(TextArea);
// Select collects children by element type, so reuse its own Option and OptGroup; they are bare identifiers because a property read such as `Select.Option` is kept as a possible side effect
export const FormSelect: FormSelectComponent & { Option: typeof SelectOption; OptGroup: typeof SelectOptGroup } = /* @__PURE__ */ Object.assign(/* @__PURE__ */ withField(Select) as unknown as FormSelectComponent, {
    Option: SelectOptionComponent,
    OptGroup: SelectOptGroupComponent,
});
export const FormCheckboxGroup: FieldComponent<typeof CheckboxGroup> = /* @__PURE__ */ withField(CheckboxGroup);
export const FormCheckbox: OptionalFieldComponent<typeof Checkbox> = /* @__PURE__ */ withField(Checkbox, {
    valuePath: 'target.checked',
    shouldInject: false,
});
export const FormRadioGroup = /* @__PURE__ */ withField(RadioGroup, { valuePath: 'target.value' }) as unknown as FormRadioGroupComponent;
export const FormRadio: OptionalFieldComponent<typeof Radio> = /* @__PURE__ */ withField(Radio, {
    valuePath: 'target.checked',
    shouldInject: false,
});
export const FormDatePicker = /* @__PURE__ */ withField(DatePicker) as unknown as FormDatePickerComponent;
export const FormSwitch: FieldComponent<typeof Switch> = /* @__PURE__ */ withField(Switch);
export const FormSlider: FieldComponent<typeof Slider> = /* @__PURE__ */ withField(Slider);
export const FormTimePicker: FieldComponent<typeof TimePicker> = /* @__PURE__ */ withField(TimePicker);
export const FormTreeSelect = /* @__PURE__ */ withField(TreeSelect) as unknown as FormTreeSelectComponent;
export const FormCascader = /* @__PURE__ */ withField(Cascader) as unknown as FormCascaderComponent;
export const FormTransfer: FieldComponent<typeof Transfer> = /* @__PURE__ */ withField(Transfer);
export const FormRating: FieldComponent<typeof Rating> = /* @__PURE__ */ withField(Rating);
export const FormAutoComplete = /* @__PURE__ */ withField(AutoComplete) as unknown as FormAutoCompleteComponent;
export const FormUpload: FieldComponent<typeof Upload, 'fileList'> = /* @__PURE__ */ withField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
});
export const FormTagInput: FieldComponent<typeof TagInput> = /* @__PURE__ */ withField(TagInput);
export const FormPinCode: FieldComponent<typeof PinCode> = /* @__PURE__ */ withField(PinCode);

export type FormCheckboxProps = InstanceType<typeof FormCheckbox>['$props'];
export type FormRadioProps = InstanceType<typeof FormRadio>['$props'];
