import { Form } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form
            render={({ formState }) => (
                <>
                    <Form.Select field="Role" label="角色" style={{ width: 176 }}>
                        <Form.Select.Option value="admin">管理员</Form.Select.Option>
                        <Form.Select.Option value="user">普通用户</Form.Select.Option>
                        <Form.Select.Option value="guest">访客</Form.Select.Option>
                    </Form.Select>
                    <Form.Input field="UserName" label="用户名" style={{ width: 80 }} />
                    <Form.Input field="Password" label="密码" style={{ width: 176 }} />
                    <code style={{ marginTop: 24 }}>{JSON.stringify(formState)}</code>
                </>
            )}
            layout="horizontal"
            onValueChange={(values) => console.log(values)}
        />
    );
}
