import { useState } from 'react';
import * as z from 'zod';
import { Button, SchemaForm } from '@fibrae/semi-ui-react';

const schema = z.object({
    name: z.string().trim().min(2, '姓名至少 2 个字符').meta({ title: '姓名' }),
    email: z.email('邮箱格式不正确').meta({ title: '邮箱' }),
    bio: z.string().max(500).optional().meta({ title: '个人简介', description: '最多 500 字' }),
    age: z.int().min(18, '需要年满 18 岁').meta({ title: '年龄' }),
    subscribed: z.boolean().default(false).meta({ title: '订阅邮件' }),
    role: z.enum(['engineer', 'designer', 'pm']).meta({ title: '角色' }),
    address: z
        .object({
            city: z.string().min(1, '请输入城市').meta({ title: '城市' }),
            street: z.string().optional().meta({ title: '街道' }),
        })
        .meta({ title: '地址' }),
    contacts: z
        .array(
            z.object({
                type: z.enum(['phone', 'wechat']).meta({ title: '方式' }),
                value: z.string().min(1, '请输入联系方式').meta({ title: '号码' }),
            })
        )
        .max(3)
        .meta({ title: '联系方式' }),
    skills: z
        .array(z.enum(['react', 'vue', 'solid', 'svelte']))
        .min(1, '至少选择一项')
        .meta({ title: '技能' }),
});

export default function FormDemo() {
    const [output, setOutput] = useState('');
    return (
        <SchemaForm schema={schema} style={{ width: 560 }} onSubmit={(values) => setOutput(JSON.stringify(values, null, 2))}>
            <Button type="primary" htmlType="submit">
                提交
            </Button>
            {output && <pre style={{ marginTop: 12 }}>{output}</pre>}
        </SchemaForm>
    );
}
