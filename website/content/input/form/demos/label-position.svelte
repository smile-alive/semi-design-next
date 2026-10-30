<script lang="ts">
    import { Form, FormCheckbox, FormCheckboxGroup, FormInput, FormInputNumber, FormLabel, FormRadio, FormRadioGroup, FormSelect, FormSwitch, Select, type FormProps, type RuleItem } from '@fibrae/semi-ui-svelte';

    let labelPosition = $state<NonNullable<FormProps['labelPosition']>>('left');
    let labelAlign = $state<NonNullable<FormProps['labelAlign']>>('left');
    const labelWidth = $derived(labelPosition === 'left' ? '180px' : 'auto');

    const rules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
    ];
    const positionOptions = [
        { label: 'top', value: 'top' },
        { label: 'left', value: 'left' },
    ];
    const alignOptions = [
        { label: 'left', value: 'left' },
        { label: 'right', value: 'right' },
    ];
    const nameOptions = [
        { label: 'mike', value: 'mike' },
        { label: 'jane', value: 'jane' },
        { label: 'kate', value: 'kate' },
    ];
</script>

<div style="border-bottom: 1px solid var(--semi-color-border); padding-bottom: 12px">
    <FormLabel style="margin-left: 10px">切换Label位置:</FormLabel>
    <Select aria-label="labelPosition" bind:value={() => labelPosition, (next) => (labelPosition = next as typeof labelPosition)} optionList={positionOptions} style="width: 200px">
        {#snippet prefix()}labelPosition{/snippet}
    </Select>
    <FormLabel style="margin-left: 10px">切换Label文本对齐方向:</FormLabel>
    <Select aria-label="labelAlign" bind:value={() => labelAlign, (next) => (labelAlign = next as typeof labelAlign)} optionList={alignOptions} style="width: 200px">
        {#snippet prefix()}labelAlign{/snippet}
    </Select>
</div>
{#key `${labelPosition}${labelAlign}`}
    <Form {labelAlign} {labelPosition} {labelWidth} style="padding: 10px; width: 600px">
        <FormInput field="input" label="手机号码" {rules} style="width: 200px" trigger="blur" />
        <FormSwitch field="agree" label="是否同意" />
        <FormInputNumber field="price" label="价格" style="width: 200px" />
        <FormSelect field="name" label="姓名" optionList={nameOptions} style="width: 200px" />
        <FormCheckboxGroup direction="horizontal" field="role" label="角色">
            <FormCheckbox value="admin">admin</FormCheckbox>
            <FormCheckbox value="user">user</FormCheckbox>
            <FormCheckbox value="guest">guest</FormCheckbox>
            <FormCheckbox value="root">root</FormCheckbox>
        </FormCheckboxGroup>
        <FormRadioGroup field="性别">
            <FormRadio value="1">man</FormRadio>
            <FormRadio value="2">woman</FormRadio>
        </FormRadioGroup>
    </Form>
{/key}
