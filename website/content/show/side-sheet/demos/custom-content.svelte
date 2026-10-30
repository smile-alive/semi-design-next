<script lang="ts">
    import { Banner, Button, Form, FormDatePicker, FormRadio, FormRadioGroup, FormSelect, SideSheet, TypographyText } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const createTime = new Date();
    const border = 'border-bottom: 1px solid var(--semi-color-border)';
    const users = [
        { value: '1', label: '曲晨一' },
        { value: '2', label: '夏可曼' },
        { value: '3', label: '曲晨三' },
        { value: '4', label: '蔡妍' },
    ];
</script>

<Button onclick={() => (visible = true)}>More Information</Button>
<SideSheet bind:visible bodyStyle={border} closable={false} headerStyle={border} title="创建资源包">
    {#snippet footer()}
        <div style="display: flex; justify-content: flex-end">
            <Button style="margin-right: 8px">重置</Button>
            <Button theme="solid">提交</Button>
        </div>
    {/snippet}
    <Form>
        <FormDatePicker field="date" initValue={createTime} label={{ text: '创建时间', required: true }} style="width: 272px" type="dateTime" />
        <FormRadioGroup direction="horizontal" field="type" initValue="all" label="目标操作系统">
            <FormRadio value="all">全平台</FormRadio>
            <FormRadio value="ios">iOS</FormRadio>
            <FormRadio value="android">Android</FormRadio>
            <FormRadio value="web">Web</FormRadio>
        </FormRadioGroup>
        <FormRadioGroup direction="horizontal" field="origin" initValue="scm" label="资源包来源">
            <FormRadio value="scm">从SCM上传</FormRadio>
            <FormRadio value="manual">手动上传</FormRadio>
        </FormRadioGroup>
        <Banner bordered fullMode={false} icon={null} type="warning">
            {#snippet description()}
                <TypographyText strong>当前部署环境：线上部署</TypographyText>
                <br />
                <TypographyText>请选择正确的SCM构建产物，防止出现不符合预期的发布操作。</TypographyText>
            {/snippet}
        </Banner>
        <br />
        <FormSelect field="users" initValue={['1', '2', '3', '4']} label={{ text: '创建用户', required: true }} multiple optionList={users} style="width: 560px" />
    </Form>
</SideSheet>
