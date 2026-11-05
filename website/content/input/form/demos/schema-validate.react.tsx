import * as z from 'zod';
import { Button, Form, Toast } from '@fibrae/semi-ui-react';

const schema = z
    .object({
        name: z.string({ error: '请输入姓名' }).trim().min(2, '姓名至少 2 个字符'),
        age: z.coerce.number({ error: '年龄要填数字' }).min(18, '需要年满 18 岁'),
        password: z.string({ error: '请输入密码' }).min(8, '密码至少 8 位'),
        confirm: z.string({ error: '请再次输入密码' }),
    })
    .refine((values) => values.password === values.confirm, { path: ['confirm'], error: '两次输入的密码不一致' });

export default function FormDemo() {
    return (
        <Form schema={schema} onSubmit={(values) => Toast.success(`姓名：${values.name}，明年 ${values.age + 1} 岁`)}>
            <Form.Input field="name" label={{ text: '姓名', required: true }} />
            <Form.Input field="age" label={{ text: '年龄', required: true }} />
            <Form.Input field="password" type="password" label={{ text: '密码', required: true }} />
            <Form.Input field="confirm" type="password" label={{ text: '确认密码', required: true }} />
            <Button type="primary" htmlType="submit">
                提交
            </Button>
        </Form>
    );
}
