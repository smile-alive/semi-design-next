import { Button, Form, FormCheckbox, FormDatePicker, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormSelect, FormSwitch, Space } from '@fibrae/semi-ui-solid';

const today = new Date(2024, 4, 6, 12);

export default function FormDemo() {
    return (
        <Form style={{ width: '560px' }}>
            <Form.Section text="基本信息">
                <FormInput field="name" label="考试名称" initValue="TCS任务平台使用" style={{ width: '560px' }} />
            </Form.Section>
            <Form.Section text="合格标准">
                <div style={{ display: 'flex' }}>
                    <FormInputNumber field="pass" initValue={60} style={{ width: '80px' }} label={{ text: '及格正确率', required: true }} />
                    <FormInputNumber field="number" initValue={10} style={{ width: '80px' }} label={{ text: '合格人数', required: true }} />
                </div>
            </Form.Section>
            <Form.Section text="考试时间">
                <FormDatePicker field="date" type="dateTime" initValue={today} style={{ width: '272px' }} label={{ text: '开始时间', required: true }} />
                <div style={{ display: 'flex' }}>
                    <FormInput field="time" label="考试时长" style={{ width: '176px' }} initValue="60" addonAfter="分钟" />
                    <FormCheckbox initValue noLabel field="auto" style={{ 'padding-top': '30px', 'margin-inline-start': '12px' }}>
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
                            <FormDatePicker type="dateTimeRange" noLabel field="customTime" style={{ width: '464px', display: 'inline-block' }} />
                        </div>
                    </FormRadio>
                </FormRadioGroup>
            </Form.Section>
            <Form.Section text="考试人员">
                <div style={{ display: 'flex' }}>
                    <FormSwitch field="open" label={{ text: '对外开放', required: true }} checkedText="开" uncheckedText="关" />
                </div>
                <FormSelect field="users" label={{ text: '考生', required: true }} style={{ width: '560px' }} multiple initValue={['1', '2', '3', '4']}>
                    <FormSelect.Option value="1">曲晨一</FormSelect.Option>
                    <FormSelect.Option value="2">夏可曼</FormSelect.Option>
                    <FormSelect.Option value="3">曲晨三</FormSelect.Option>
                    <FormSelect.Option value="4">蔡妍</FormSelect.Option>
                </FormSelect>
            </Form.Section>
            <Space>
                <Button type="primary" theme="solid" style={{ width: '120px', 'margin-top': '12px', 'margin-inline-end': '4px' }}>
                    创建考试
                </Button>
                <Button style={{ 'margin-top': '12px' }}>预览</Button>
            </Space>
        </Form>
    );
}
