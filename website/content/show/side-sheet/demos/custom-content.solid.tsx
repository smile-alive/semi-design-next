import { createSignal } from 'solid-js';
import { Banner, Button, Form, FormDatePicker, FormRadio, FormRadioGroup, FormSelect, SideSheet, Typography } from '@fibrae/semi-ui-solid';

export default function SideSheetDemo() {
    const [visible, setVisible] = createSignal(false);
    const createTime = new Date();

    const show = () => {
        setVisible(true);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    return (
        <>
            <Button onClick={show}>More Information</Button>
            <SideSheet
                title="创建资源包"
                headerStyle={{ 'border-bottom': '1px solid var(--semi-color-border)' }}
                bodyStyle={{ 'border-bottom': '1px solid var(--semi-color-border)' }}
                visible={visible()}
                footer={
                    <div style={{ display: 'flex', 'justify-content': 'flex-end' }}>
                        <Button style={{ 'margin-right': '8px' }}>重置</Button>
                        <Button theme="solid">提交</Button>
                    </div>
                }
                closable={false}
                onCancel={handleCancel}
            >
                <Form>
                    <FormDatePicker field="date" type="dateTime" initValue={createTime} style={{ width: '272px' }} label={{ text: '创建时间', required: true }} />
                    <FormRadioGroup field="type" label="目标操作系统" direction="horizontal" initValue="all">
                        <FormRadio value="all">全平台</FormRadio>
                        <FormRadio value="ios">iOS</FormRadio>
                        <FormRadio value="android">Android</FormRadio>
                        <FormRadio value="web">Web</FormRadio>
                    </FormRadioGroup>
                    <FormRadioGroup field="origin" label="资源包来源" direction="horizontal" initValue="scm">
                        <FormRadio value="scm">从SCM上传</FormRadio>
                        <FormRadio value="manual">手动上传</FormRadio>
                    </FormRadioGroup>
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
                    <FormSelect field="users" label={{ text: '创建用户', required: true }} style={{ width: '560px' }} multiple initValue={['1', '2', '3', '4']}>
                        <FormSelect.Option value="1">曲晨一</FormSelect.Option>
                        <FormSelect.Option value="2">夏可曼</FormSelect.Option>
                        <FormSelect.Option value="3">曲晨三</FormSelect.Option>
                        <FormSelect.Option value="4">蔡妍</FormSelect.Option>
                    </FormSelect>
                </Form>
            </SideSheet>
        </>
    );
}
