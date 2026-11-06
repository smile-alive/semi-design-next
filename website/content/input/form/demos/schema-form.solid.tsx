import { Show, createSignal } from 'solid-js';
import * as z from 'zod';
import { Button, SchemaForm } from '@fibrae/semi-ui-solid';

const schema = z.object({
    email: z.email('邮箱格式不正确').meta({ title: '邮箱' }),
    bio: z.string().max(500).optional().meta({ title: '简介', description: '最多 500 字' }),
    age: z.int().min(0).max(150).meta({ title: '年龄' }),
    subscribed: z.boolean().default(false).meta({ title: '订阅周报' }),
    role: z.enum(['engineer', 'designer', 'pm']).meta({ title: '角色' }),
    address: z
        .object({
            city: z.string().meta({ title: '城市' }),
            street: z.string().optional().meta({ title: '街道' }),
        })
        .meta({ title: '地址' }),
    contacts: z
        .array(
            z.object({
                name: z.string().meta({ title: '联系人' }),
                phone: z.string().optional().meta({ title: '电话' }),
            })
        )
        .max(3)
        .meta({ title: '紧急联系人' }),
    tags: z.array(z.enum(['frontend', 'backend', 'design'])).meta({ title: '标签' }),
});

export default function FormDemo() {
    const [output, setOutput] = createSignal<z.output<typeof schema>>();

    return (
        <SchemaForm schema={schema} style={{ width: '480px' }} onSubmit={(values) => setOutput(values)}>
            <Button type="primary" htmlType="submit">
                提交
            </Button>
            <Show when={output()}>{(values) => <pre style={{ 'margin-top': '12px' }}>{JSON.stringify(values(), null, 2)}</pre>}</Show>
        </SchemaForm>
    );
}
