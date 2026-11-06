import * as z from 'zod';
import { Button, Form, Input, SchemaField, Typography, withField } from '@fibrae/semi-ui-react';

const schema = z.object({
    title: z.string().min(2, '标题至少 2 个字符').meta({ title: '标题' }),
    profile: z
        .object({
            homepage: z.url('请输入网址').meta({ title: '主页' }),
            level: z.number().min(1).max(5).meta({ title: '等级' }),
            note: z.string().optional().meta({ title: '备注' }),
        })
        .meta({ title: '资料' }),
});

function LinkInput({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input aria-label="主页地址" value={value} onChange={(next) => onChange?.(next)} style={{ flex: 1 }} />
            {value && (
                <Typography.Text link={{ href: value, target: '_blank' }} size="small">
                    打开
                </Typography.Text>
            )}
        </div>
    );
}

const FormLinkInput = withField(LinkInput);

export default function FormDemo() {
    return (
        <Form schema={schema} style={{ width: 480 }} onSubmit={(values) => console.log(values)}>
            <Form.Input field="title" label={{ text: '标题', required: true }} />
            <SchemaField field="profile" renderField={{ 'profile.note': ({ field }) => <Form.TextArea field={field} label="备注（renderField 覆盖）" autosize /> }} widgets={{ uri: FormLinkInput }} />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
