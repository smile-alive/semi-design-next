<script lang="ts">
    import { Button, Form, FormCheckbox, FormDatePicker, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormSection, FormSelect, FormSwitch, Space } from '@fibrae/semi-ui-svelte';

    const today = new Date(2024, 4, 6, 10, 30, 0);
    const userOptions = [
        { label: '曲晨一', value: '1' },
        { label: '夏可曼', value: '2' },
        { label: '曲晨三', value: '3' },
        { label: '蔡妍', value: '4' },
    ];
</script>

<Form style="width: 560px">
    <FormSection>
        {#snippet text()}基本信息{/snippet}
        <FormInput field="name" initValue="TCS任务平台使用" label="考试名称" style="width: 560px" />
    </FormSection>
    <FormSection>
        {#snippet text()}合格标准{/snippet}
        <div style="display: flex">
            <FormInputNumber field="pass" initValue={60} label={{ text: '及格正确率', required: true }} style="width: 80px" />
            <FormInputNumber field="number" initValue={10} label={{ text: '合格人数', required: true }} style="width: 80px" />
        </div>
    </FormSection>
    <FormSection>
        {#snippet text()}考试时间{/snippet}
        <FormDatePicker field="date" initValue={today} label={{ text: '开始时间', required: true }} style="width: 272px" type="dateTime" />
        <div style="display: flex">
            <FormInput field="time" initValue="60" label="考试时长" style="width: 176px">
                {#snippet addonAfter()}分钟{/snippet}
            </FormInput>
            <FormCheckbox field="auto" initValue noLabel style="padding-top: 30px; margin-inline-start: 12px">到时间自动交卷</FormCheckbox>
        </div>
        <FormRadioGroup direction="vertical" field="type" initValue="always" label="有效时间">
            <FormRadio value="always">永久有效</FormRadio>
            <FormRadio value="user">自定义有效期</FormRadio>
        </FormRadioGroup>
        <FormRadioGroup direction="vertical" field="answerTime" initValue="always" label="答案放出时间" rules={[{ required: true }]}>
            <FormRadio value="always">自动放出</FormRadio>
            <FormRadio value="user">
                <div style="display: inline-block">
                    自定义放出时间
                    <FormDatePicker field="customTime" noLabel style="width: 464px; display: inline-block" type="dateTimeRange" />
                </div>
            </FormRadio>
        </FormRadioGroup>
    </FormSection>
    <FormSection>
        {#snippet text()}考试人员{/snippet}
        <div style="display: flex">
            <FormSwitch field="open" label={{ text: '对外开放', required: true }}>
                {#snippet checkedText()}开{/snippet}
                {#snippet uncheckedText()}关{/snippet}
            </FormSwitch>
        </div>
        <FormSelect field="users" initValue={['1', '2', '3', '4']} label={{ text: '考生', required: true }} multiple optionList={userOptions} style="width: 560px" />
    </FormSection>
    <Space>
        <Button style="width: 120px; margin-top: 12px; margin-inline-end: 4px" theme="solid" type="primary">创建考试</Button>
        <Button style="margin-top: 12px">预览</Button>
    </Space>
</Form>
