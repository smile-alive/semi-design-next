<script lang="ts">
    import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-svelte';

    const roleOptions = [
        { label: '运营', value: 'operate' },
        { label: '开发', value: 'rd' },
        { label: '产品', value: 'pm' },
        { label: '设计', value: 'ued' },
    ];
</script>

<Form labelAlign="right" labelCol={{ span: 2 }} labelPosition="left" wrapperCol={{ span: 20 }}>
    <FormInput field="name" label="姓名" placeholder="请输入姓名" style="width: 250px" trigger="blur" />
    <FormSelect field="role" label="角色" optionList={roleOptions} placeholder="请选择角色" style="width: 250px" />
</Form>
