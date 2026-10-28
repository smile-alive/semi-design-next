import { useState } from 'react';
import { SideSheet, Form, Button, Typography, Banner } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const [createTime] = useState(() => new Date());

    const show = () => {
        setVisible(true);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    const { DatePicker, Select, Radio, RadioGroup } = Form;

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style={{ marginRight: 8 }}>重置</Button>
            <Button theme="solid">提交</Button>
        </div>
    );

    return (
        <>
            <Button onClick={show}>More Information</Button>
            <SideSheet title="创建资源包" headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }} bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }} visible={visible} footer={footer} closable={false} onCancel={handleCancel}>
                <Form>
                    <DatePicker field="date" type="dateTime" initValue={createTime} style={{ width: 272 }} label={{ text: '创建时间', required: true }} />
                    <RadioGroup field="type" label="目标操作系统" direction="horizontal" initValue="all">
                        <Radio value="all">全平台</Radio>
                        <Radio value="ios">iOS</Radio>
                        <Radio value="android">Android</Radio>
                        <Radio value="web">Web</Radio>
                    </RadioGroup>
                    <RadioGroup field="origin" label="资源包来源" direction="horizontal" initValue="scm">
                        <Radio value="scm">从SCM上传</Radio>
                        <Radio value="manual">手动上传</Radio>
                    </RadioGroup>
                    <Banner
                        fullMode={false}
                        icon={null}
                        type="warning"
                        bordered
                        description={
                            <>
                                <Typography.Text strong>当前部署环境：线上部署</Typography.Text>
                                <br />
                                <Typography.Text>请选择正确的SCM构建产物，防止出现不符合预期的发布操作。</Typography.Text>
                            </>
                        }
                    />
                    <br />
                    <Select field="users" label={{ text: '创建用户', required: true }} style={{ width: 560 }} multiple initValue={['1', '2', '3', '4']}>
                        <Select.Option value="1">曲晨一</Select.Option>
                        <Select.Option value="2">夏可曼</Select.Option>
                        <Select.Option value="3">曲晨三</Select.Option>
                        <Select.Option value="4">蔡妍</Select.Option>
                    </Select>
                </Form>
            </SideSheet>
        </>
    );
}
