import { Form, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const [formApi, formState, formValues] = Form.useForm();

    const handleClick = () => {
        formApi.setValue('username', 'semi');
        console.log('当前表单值：', formValues);
    };

    return (
        <>
            <Button onClick={handleClick}>外部设置值</Button>
            <Button onClick={() => formApi.reset()}>重置表单</Button>

            <Form form={formApi}>
                <Form.Input field="username" label="用户名" />
                <Form.Input field="email" label="邮箱" />
            </Form>

            <div style={{ marginTop: 16 }}>
                <div>表单值：{JSON.stringify(formValues)}</div>
                <div>touched 状态：{JSON.stringify(formState.touched)}</div>
            </div>
        </>
    );
}
