<script lang="ts">
    import { Button, Form, FormInput, FormInputGroup, FormSelect } from '@fibrae/semi-ui-svelte';

    const onSubmit = (values: unknown) => console.log(values);

    const prefixOptions = [
        { label: '美国+1', value: '+1' },
        { label: '香港+852', value: '+852' },
        { label: '中国+86', value: '+86' },
        { label: '日本+81', value: '+81' },
    ];
</script>

<Form labelPosition="top" {onSubmit} style="width: 400px">
    <FormInputGroup label={{ text: '手机号码', required: true }} labelPosition="top">
        <FormSelect field="phonePrefix" initValue="+86" optionList={prefixOptions} rules={[{ required: true }]} showClear style="width: 150px" />
        <FormInput field="phoneNumber" initValue="18912345678" rules={[{ required: true }]} showClear style="width: 250px" />
    </FormInputGroup>
    <FormInput field="姓名" initValue="Semi" trigger="blur" />
    <Button htmlType="submit">提交</Button>
</Form>
