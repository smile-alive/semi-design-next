import { Button, Form, FormInput, Toast, type FormApi } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    let formApi: FormApi | undefined;

    const handleSilentValidate = () => {
        formApi
            ?.validate({ silent: true })
            .then((values) => {
                Toast.success('表单校验通过，准备发起请求');
                console.log('发起后端请求:', values);
            })
            .catch((errors) => {
                Toast.error('表单校验未通过，但不显示错误提示');
                console.log('校验错误:', errors);
            });
    };

    const handleNormalValidate = () => {
        formApi
            ?.validate()
            .then(() => {
                Toast.success('表单校验通过');
            })
            .catch(() => {
                Toast.error('表单校验未通过，显示错误提示');
            });
    };

    return (
        <Form getFormApi={(api) => (formApi = api)} layout="horizontal">
            <FormInput
                field="username"
                label="用户名"
                rules={[
                    { required: true, message: '用户名不能为空' },
                    { min: 3, message: '用户名至少 3 个字符' },
                ]}
            />
            <FormInput
                field="email"
                label="邮箱"
                rules={[
                    { required: true, message: '邮箱不能为空' },
                    { type: 'email', message: '邮箱格式不正确' },
                ]}
            />
            <div style={{ display: 'flex', gap: '12px', 'margin-top': '12px' }}>
                <Button onClick={handleSilentValidate} type="primary">
                    静默校验（不显示错误）
                </Button>
                <Button onClick={handleNormalValidate}>普通校验（显示错误）</Button>
            </div>
        </Form>
    );
}
