import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import {
    Form,
    FormAutoComplete,
    FormCascader,
    FormCheckbox,
    FormCheckboxGroup,
    FormDatePicker,
    FormErrorMessage,
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
} from '../index';
import type { FormApi } from '../interface';
import FormStatics from './form-statics.svelte';
import { settle } from './helpers';

describe('Form 的静态成员', () => {
    it('静态成员与具名导出是同一引用', () => {
        expect(Form.Input).toBe(FormInput);
        expect(Form.TextArea).toBe(FormTextArea);
        expect(Form.InputNumber).toBe(FormInputNumber);
        expect(Form.Select).toBe(FormSelect);
        expect(Form.Checkbox).toBe(FormCheckbox);
        expect(Form.CheckboxGroup).toBe(FormCheckboxGroup);
        expect(Form.Radio).toBe(FormRadio);
        expect(Form.RadioGroup).toBe(FormRadioGroup);
        expect(Form.DatePicker).toBe(FormDatePicker);
        expect(Form.TimePicker).toBe(FormTimePicker);
        expect(Form.Switch).toBe(FormSwitch);
        expect(Form.Slider).toBe(FormSlider);
        expect(Form.TreeSelect).toBe(FormTreeSelect);
        expect(Form.Cascader).toBe(FormCascader);
        expect(Form.Transfer).toBe(FormTransfer);
        expect(Form.Rating).toBe(FormRating);
        expect(Form.AutoComplete).toBe(FormAutoComplete);
        expect(Form.Upload).toBe(FormUpload);
        expect(Form.TagInput).toBe(FormTagInput);
        expect(Form.PinCode).toBe(FormPinCode);
        expect(Form.Slot).toBe(FormSlot);
        expect(Form.ErrorMessage).toBe(FormErrorMessage);
        expect(Form.InputGroup).toBe(FormInputGroup);
        expect(Form.Label).toBe(FormLabel);
        expect(Form.Section).toBe(FormSection);
        expect(Form.useForm).toBe(useForm);
    });

    it('模板用 <Form.Input> 点号写法渲染字段，值写入表单', async () => {
        let api: FormApi | undefined;
        render(FormStatics, { props: { onApi: (formApi: FormApi) => (api = formApi) } });
        await settle();
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('semi');
        expect(screen.getByRole('group', { name: 'Members' })).toBeInTheDocument();
        expect(api?.getValues()).toEqual({ name: 'semi', members: ['a'] });
    });
});
