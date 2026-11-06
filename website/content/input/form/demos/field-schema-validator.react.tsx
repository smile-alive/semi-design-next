import * as z from 'zod';
import { Button, Form } from '@fibrae/semi-ui-react';

const username = z.string({ error: '请输入用户名' }).min(3, '用户名至少 3 个字符').regex(/^\w+$/, '只能包含字母、数字和下划线');

export default function FormDemo() {
    return (
        <Form style={{ width: 400 }}>
            <Form.Input field="username" label={{ text: '用户名（validator 传 zod schema）', required: true }} validator={username} />
            <Form.Input
                field="nickname"
                label="昵称（rules）"
                rules={[
                    { required: true, message: '请输入昵称' },
                    { min: 3, message: '昵称至少 3 个字符' },
                ]}
            />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
