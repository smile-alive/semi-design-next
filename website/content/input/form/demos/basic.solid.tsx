import { IconHelpCircle } from '@fibrae/semi-icons-solid';
import { Form, FormInput, FormSelect, Tooltip } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form layout="horizontal" onValueChange={(values) => console.log(values)}>
            <FormInput field="UserName" label="用户名" style={{ width: '80px' }} />
            <FormInput
                field="Password"
                label={{
                    text: '密码',
                    extra: (
                        <Tooltip content="详情">
                            <IconHelpCircle aria-label="帮助" style={{ color: 'var(--semi-color-text-2)' }} />
                        </Tooltip>
                    ),
                }}
                style={{ width: '176px' }}
            />
            <FormSelect field="Role" label={{ text: '角色', optional: true }} style={{ width: '176px' }}>
                <FormSelect.Option value="admin">管理员</FormSelect.Option>
                <FormSelect.Option value="user">普通用户</FormSelect.Option>
                <FormSelect.Option value="guest">访客</FormSelect.Option>
            </FormSelect>
        </Form>
    );
}
