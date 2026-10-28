import { Form, Button, Space } from '@fibrae/semi-ui-react';

const startDate = new Date(2019, 6, 23, 12);

export default function FormDemo() {
    const { Section, Input, DatePicker, Select, Switch, InputNumber, Checkbox, RadioGroup, Radio } = Form;
    return (
        <Form style={{ width: 560 }}>
            <Section text="基本信息">
                <Input field="name" label="考试名称" initValue="TCS任务平台使用" style={{ width: 560 }} />
            </Section>
            <Section text="合格标准">
                <div style={{ display: 'flex' }}>
                    <InputNumber field="pass" initValue={60} style={{ width: 80 }} label={{ text: '及格正确率', required: true }} />
                    <InputNumber field="number" initValue={10} style={{ width: 80 }} label={{ text: '合格人数', required: true }} />
                </div>
            </Section>
            <Section text="考试时间">
                <DatePicker field="date" type="dateTime" initValue={startDate} style={{ width: 272 }} label={{ text: '开始时间', required: true }} />
                <div style={{ display: 'flex' }}>
                    <Input field="time" label="考试时长" style={{ width: 176 }} initValue="60" addonAfter="分钟" />
                    <Checkbox initValue noLabel field="auto" style={{ paddingTop: 30, marginInlineStart: 12 }}>
                        到时间自动交卷
                    </Checkbox>
                </div>
                <RadioGroup field="type" label="有效时间" direction="vertical" initValue="always">
                    <Radio value="always">永久有效</Radio>
                    <Radio value="user">自定义有效期</Radio>
                </RadioGroup>
                <RadioGroup field="answerTime" label="答案放出时间" direction="vertical" initValue="always" rules={[{ required: true }]}>
                    <Radio value="always">自动放出</Radio>
                    <Radio value="user">
                        <div style={{ display: 'inline-block' }}>
                            自定义放出时间
                            <Form.DatePicker type="dateTimeRange" noLabel field="customTime" style={{ width: 464, display: 'inline-block' }} />
                        </div>
                    </Radio>
                </RadioGroup>
            </Section>
            <Section text="考试人员">
                <div style={{ display: 'flex' }}>
                    <Switch field="open" label={{ text: '对外开放', required: true }} checkedText="开" uncheckedText="关" />
                </div>
                <Select field="users" label={{ text: '考生', required: true }} style={{ width: 560 }} multiple initValue={['1', '2', '3', '4']}>
                    <Select.Option value="1">曲晨一</Select.Option>
                    <Select.Option value="2">夏可曼</Select.Option>
                    <Select.Option value="3">曲晨三</Select.Option>
                    <Select.Option value="4">蔡妍</Select.Option>
                </Select>
            </Section>
            <Space>
                <Button type="primary" theme="solid" style={{ width: 120, marginTop: 12, marginInlineEnd: 4 }}>
                    创建考试
                </Button>
                <Button style={{ marginTop: 12 }}>预览</Button>
            </Space>
        </Form>
    );
}
