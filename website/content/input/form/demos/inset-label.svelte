<script lang="ts">
    import { Form, FormDatePicker, FormInput, FormSelect } from '@fibrae/semi-ui-svelte';

    const today = new Date(2024, 4, 6, 10, 30, 0);
    const roleOptions = [
        { label: '运营', value: 'operate' },
        { label: '开发', value: 'rd' },
        { label: '产品', value: 'pm' },
        { label: '设计', value: 'ued' },
    ];
</script>

<Form labelPosition="inset" layout="horizontal">
    <FormInput field="name" initValue="semi" label="姓名" placeholder="请输入姓名" style="width: 250px" trigger="blur" />
    <FormSelect field="role" initValue="rd" label="角色" optionList={roleOptions} style="width: 250px" />
    <FormDatePicker field="date" initValue={today} label="开始日期" style="width: 250px" />
</Form>
