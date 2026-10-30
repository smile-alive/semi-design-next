import ArrayField from './array-field.svelte';
import FormErrorMessage from './error-message.svelte';
import FormField from './field.svelte';
import FormAutoComplete from './form-auto-complete.svelte';
import FormCascader from './form-cascader.svelte';
import FormCheckboxGroup from './form-checkbox-group.svelte';
import FormCheckbox from './form-checkbox.svelte';
import FormDatePicker from './form-date-picker.svelte';
import FormInputNumber from './form-input-number.svelte';
import FormInput from './form-input.svelte';
import FormPinCode from './form-pin-code.svelte';
import FormRadioGroup from './form-radio-group.svelte';
import FormRadio from './form-radio.svelte';
import FormRating from './form-rating.svelte';
import FormSelect from './form-select.svelte';
import FormSlider from './form-slider.svelte';
import FormSwitch from './form-switch.svelte';
import FormTagInput from './form-tag-input.svelte';
import FormTextArea from './form-text-area.svelte';
import FormTimePicker from './form-time-picker.svelte';
import FormTransfer from './form-transfer.svelte';
import FormTreeSelect from './form-tree-select.svelte';
import FormUpload from './form-upload.svelte';
import FormBase from './form.svelte';
import FormInputGroup from './input-group.svelte';
import FormLabel from './label.svelte';
import FormSection from './section.svelte';
import FormSlot from './slot.svelte';
import useForm from './use-form.svelte.js';

// Svelte components are functions, so the parts attach to the component itself
export const Form: typeof FormBase & {
    Input: typeof FormInput;
    TextArea: typeof FormTextArea;
    InputNumber: typeof FormInputNumber;
    Select: typeof FormSelect;
    Checkbox: typeof FormCheckbox;
    CheckboxGroup: typeof FormCheckboxGroup;
    Radio: typeof FormRadio;
    RadioGroup: typeof FormRadioGroup;
    DatePicker: typeof FormDatePicker;
    TimePicker: typeof FormTimePicker;
    Switch: typeof FormSwitch;
    Slider: typeof FormSlider;
    TreeSelect: typeof FormTreeSelect;
    Cascader: typeof FormCascader;
    Transfer: typeof FormTransfer;
    Rating: typeof FormRating;
    AutoComplete: typeof FormAutoComplete;
    Upload: typeof FormUpload;
    TagInput: typeof FormTagInput;
    PinCode: typeof FormPinCode;
    Slot: typeof FormSlot;
    ErrorMessage: typeof FormErrorMessage;
    InputGroup: typeof FormInputGroup;
    Label: typeof FormLabel;
    Section: typeof FormSection;
    useForm: typeof useForm;
} = Object.assign(FormBase, {
    Input: FormInput,
    TextArea: FormTextArea,
    InputNumber: FormInputNumber,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    CheckboxGroup: FormCheckboxGroup,
    Radio: FormRadio,
    RadioGroup: FormRadioGroup,
    DatePicker: FormDatePicker,
    TimePicker: FormTimePicker,
    Switch: FormSwitch,
    Slider: FormSlider,
    TreeSelect: FormTreeSelect,
    Cascader: FormCascader,
    Transfer: FormTransfer,
    Rating: FormRating,
    AutoComplete: FormAutoComplete,
    Upload: FormUpload,
    TagInput: FormTagInput,
    PinCode: FormPinCode,
    Slot: FormSlot,
    ErrorMessage: FormErrorMessage,
    InputGroup: FormInputGroup,
    Label: FormLabel,
    Section: FormSection,
    useForm,
});

export {
    ArrayField,
    FormAutoComplete,
    FormCascader,
    FormCheckbox,
    FormCheckboxGroup,
    FormDatePicker,
    FormErrorMessage,
    FormField,
    FormInput,
    FormInputGroup,
    FormInputNumber,
    FormLabel,
    FormPinCode,
    FormRadio,
    FormRadioGroup,
    FormRating,
    FormSection,
    FormSelect,
    FormSlider,
    FormSlot,
    FormSwitch,
    FormTagInput,
    FormTextArea,
    FormTimePicker,
    FormTransfer,
    FormTreeSelect,
    FormUpload,
    useForm,
};
export { useFieldApi, useFieldState, useFormApi, useFormState } from './hooks.js';
export type {
    ArrayFieldItem,
    ArrayFieldProps,
    ArrayFieldSnippetProps,
    CommonFieldProps,
    ErrorMessageProps,
    FieldError,
    FieldLabel,
    FieldProps,
    FieldValidateResult,
    FieldValidateTriggerType,
    FormApi,
    FormFieldProps,
    FormProps,
    FormRenderProps,
    FormState,
    InputGroupProps as FormInputGroupProps,
    LabelProps as FormLabelProps,
    OptionalFieldProps,
    RuleItem,
    ScrollOptions,
    SectionProps as FormSectionProps,
    SlotProps as FormSlotProps,
    WithFieldOption,
} from './interface.js';
