import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form
            render={(form) => (
                <>
                    <FormSelect field="Role" label="角色" style={{ width: 176 }}>
                        <FormSelect.Option value="admin">管理员</FormSelect.Option>
                        <FormSelect.Option value="user">普通用户</FormSelect.Option>
                        <FormSelect.Option value="guest">访客</FormSelect.Option>
                    </FormSelect>
                    <FormInput field="UserName" label="用户名" style={{ width: 80 }} />
                    <FormInput field="Password" label="密码" style={{ width: 176 }} />
                    <code style={{ marginBlockStart: 24 }}>{JSON.stringify(form.formState)}</code>
                </>
            )}
            layout="horizontal"
            onValueChange={(values) => console.log(values)}
        />
    );
}
