import { Form, FormCheckbox, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormSection, FormSelect, FormSwitch, FormDatePicker, Button, Space } from '@fibrae/semi-ui-react';

const today = new Date(2024, 4, 6, 10, 30, 0);

export default function FormDemo() {
    return (
        <Form style={{ width: 560 }}>
            <FormSection text="基本信息">
                <FormInput field="name" label="考试名称" initValue="TCS任务平台使用" style={{ width: 560 }} />
            </FormSection>
            <FormSection text="合格标准">
                <div style={{ display: 'flex' }}>
                    <FormInputNumber field="pass" initValue={60} style={{ width: 80 }} label={{ text: '及格正确率', required: true }} />
                    <FormInputNumber field="number" initValue={10} style={{ width: 80 }} label={{ text: '合格人数', required: true }} />
                </div>
            </FormSection>
            <FormSection text="考试时间">
                <FormDatePicker field="date" type="dateTime" initValue={today} style={{ width: 272 }} label={{ text: '开始时间', required: true }} />
                <div style={{ display: 'flex' }}>
                    <FormInput field="time" label="考试时长" style={{ width: 176 }} initValue="60" addonAfter="分钟" />
                    <FormCheckbox initValue noLabel field="auto" style={{ paddingBlockStart: 30, marginInlineStart: 12 }}>
                        到时间自动交卷
                    </FormCheckbox>
                </div>
                <FormRadioGroup field="type" label="有效时间" direction="vertical" initValue="always">
                    <FormRadio value="always">永久有效</FormRadio>
                    <FormRadio value="user">自定义有效期</FormRadio>
                </FormRadioGroup>
                <FormRadioGroup field="answerTime" label="答案放出时间" direction="vertical" initValue="always" rules={[{ required: true }]}>
                    <FormRadio value="always">自动放出</FormRadio>
                    <FormRadio value="user">
                        <div style={{ display: 'inline-block' }}>
                            自定义放出时间
                            <FormDatePicker type="dateTimeRange" noLabel field="customTime" style={{ width: 464, display: 'inline-block' }} />
                        </div>
                    </FormRadio>
                </FormRadioGroup>
            </FormSection>
            <FormSection text="考试人员">
                <div style={{ display: 'flex' }}>
                    <FormSwitch field="open" label={{ text: '对外开放', required: true }} checkedText="开" uncheckedText="关" />
                </div>
                <FormSelect field="users" label={{ text: '考生', required: true }} style={{ width: 560 }} multiple initValue={['1', '2', '3', '4']}>
                    <FormSelect.Option value="1">曲晨一</FormSelect.Option>
                    <FormSelect.Option value="2">夏可曼</FormSelect.Option>
                    <FormSelect.Option value="3">曲晨三</FormSelect.Option>
                    <FormSelect.Option value="4">蔡妍</FormSelect.Option>
                </FormSelect>
            </FormSection>
            <Space>
                <Button type="primary" theme="solid" style={{ width: 120, marginBlockStart: 12, marginInlineEnd: 4 }}>
                    创建考试
                </Button>
                <Button style={{ marginBlockStart: 12 }}>预览</Button>
            </Space>
        </Form>
    );
}
