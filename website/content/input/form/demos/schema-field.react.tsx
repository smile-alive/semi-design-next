import type { ComponentProps } from 'react';
import * as z from 'zod';
import { IconLink } from '@fibrae/semi-icons-react';
import { Button, Form, FormInput, FormRating, type SchemaFieldRenderer, SchemaField, Toast } from '@fibrae/semi-ui-react';

const schema = z.object({
    title: z.string().min(2, '标题至少 2 个字符'),
    profile: z
        .object({
            homepage: z.url('请输入完整的网址').meta({ title: '主页' }),
            score: z.int().min(1).max(5).meta({ title: '评分' }),
            intro: z.string().optional().meta({ title: '介绍' }),
        })
        .meta({ title: '资料' }),
});

function UrlInput(props: ComponentProps<typeof FormInput>) {
    return <FormInput {...props} placeholder="https://" prefix={<IconLink />} />;
}

const renderField: Record<string, SchemaFieldRenderer> = {
    'profile.score': (context) => <FormRating field={context.field} label={{ text: context.node.title, required: context.node.required }} />,
};

export default function FormDemo() {
    return (
        <Form schema={schema} style={{ width: 480 }} onSubmit={(values) => Toast.success(JSON.stringify(values))}>
            <FormInput field="title" label={{ text: '标题', required: true }} />
            <SchemaField field="profile" renderField={renderField} widgets={{ uri: UrlInput }} />
            <Button type="primary" htmlType="submit">
                提交
            </Button>
        </Form>
    );
}
