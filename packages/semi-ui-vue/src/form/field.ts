import type { VNode } from 'vue';
import type { ElementProps, EmitHandlers, EmitProps } from '../_base/element-props';
import AutoComplete, { type AutoCompleteEmits, type AutoCompleteHandle, type AutoCompleteItems, type AutoCompleteProps, type AutoCompleteSlots } from '../auto-complete';
import Cascader, { type CascaderEmits, type CascaderHandle, type CascaderProps, type CascaderSlots } from '../cascader';
import Checkbox, { CheckboxGroup } from '../checkbox';
import DatePicker from '../date-picker';
import Input, { TextArea } from '../input';
import InputNumber from '../input-number';
import PinCode from '../pincode';
import Radio, { RadioGroup } from '../radio';
import Rating from '../rating';
import Select, { type BasicSelectValue, type SelectEmits, type SelectHandle, type SelectOptGroup, type SelectOption, type SelectProps, type SelectSlots } from '../select';
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

type FormAutoCompleteProps<T extends AutoCompleteItems> = FieldProps<CallSiteProps<AutoCompleteProps<T>, AutoCompleteEmits>>;

type FormAutoCompleteComponent = <T extends AutoCompleteItems = AutoCompleteItems>(props: FormAutoCompleteProps<T>, ctx?: GenericFieldContext<AutoCompleteSlots<T>>) => GenericFieldNode<FormAutoCompleteProps<T>, AutoCompleteSlots<T>, AutoCompleteHandle>;

type OptionalLatestValues<P> = P extends { onChange?: (event: infer E, latestValues: infer L) => infer R } ? (event: E, latestValues?: L) => R : never;

type FieldPropsOf<C> = InstanceType<FieldComponent<C>>['$props'];

// Without `field` it renders as the bare control, as inside its group, whose change carries no latest values. The
// change is not split into one signature per case: a template types its listener from the props' onChange alone, so a
// union of the two would leave the listener's parameters untyped.
type OptionalFieldComponent<C> = new () => Omit<InstanceType<FieldComponent<C>>, '$props'> & {
    $props: Omit<FieldPropsOf<C>, 'field' | 'onChange'> & { field?: string; onChange?: OptionalLatestValues<FieldPropsOf<C>> };
};

export const FormInput: FieldComponent<typeof Input> = withField(Input);
export const FormInputNumber: FieldComponent<typeof InputNumber> = withField(InputNumber);
export const FormTextArea: FieldComponent<typeof TextArea> = withField(TextArea);
// Select collects children by element type, so reuse its own Option and OptGroup
export const FormSelect: FormSelectComponent & { Option: typeof SelectOption; OptGroup: typeof SelectOptGroup } = Object.assign(withField(Select) as unknown as FormSelectComponent, {
    Option: Select.Option,
    OptGroup: Select.OptGroup,
});
export const FormCheckboxGroup: FieldComponent<typeof CheckboxGroup> = withField(CheckboxGroup);
export const FormCheckbox: OptionalFieldComponent<typeof Checkbox> = withField(Checkbox, {
    valuePath: 'target.checked',
    shouldInject: false,
});
export const FormRadioGroup: FieldComponent<typeof RadioGroup> = withField(RadioGroup, { valuePath: 'target.value' });
export const FormRadio: OptionalFieldComponent<typeof Radio> = withField(Radio, {
    valuePath: 'target.checked',
    shouldInject: false,
});
export const FormDatePicker: FieldComponent<typeof DatePicker> = withField(DatePicker);
export const FormSwitch: FieldComponent<typeof Switch> = withField(Switch);
export const FormSlider: FieldComponent<typeof Slider> = withField(Slider);
export const FormTimePicker: FieldComponent<typeof TimePicker> = withField(TimePicker);
export const FormTreeSelect = withField(TreeSelect) as unknown as FormTreeSelectComponent;
export const FormCascader = withField(Cascader) as unknown as FormCascaderComponent;
export const FormTransfer: FieldComponent<typeof Transfer> = withField(Transfer);
export const FormRating: FieldComponent<typeof Rating> = withField(Rating);
export const FormAutoComplete = withField(AutoComplete) as unknown as FormAutoCompleteComponent;
export const FormUpload: FieldComponent<typeof Upload, 'fileList'> = withField(Upload, {
    valueKey: 'fileList',
    valuePath: 'fileList',
});
export const FormTagInput: FieldComponent<typeof TagInput> = withField(TagInput);
export const FormPinCode: FieldComponent<typeof PinCode> = withField(PinCode);

export type FormCheckboxProps = InstanceType<typeof FormCheckbox>['$props'];
export type FormRadioProps = InstanceType<typeof FormRadio>['$props'];
