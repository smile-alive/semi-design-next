import * as z from 'zod';
import { IconLink } from '@fibrae/semi-icons-solid';
import { Button, Form, FormInput, FormRating, SchemaField, type SchemaFieldProps, type SchemaFieldRenderers, semiRenderers, Toast } from '@fibrae/semi-ui-solid';

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

const renderers: SchemaFieldRenderers = {
    ...semiRenderers,
    field: (context) => (context.node.format === 'uri' ? <FormInput field={context.node.field} label={{ text: context.node.title, required: context.node.required }} placeholder="https://" prefix={<IconLink />} /> : semiRenderers.field(context)),
};

const renderField: SchemaFieldProps['renderField'] = {
    'profile.score': (context) => <FormRating field={context.node.field} label={{ text: context.node.title, required: context.node.required }} />,
};

export default function FormDemo() {
    return (
        <Form schema={schema} style={{ width: '480px' }} onSubmit={(values) => Toast.success(JSON.stringify(values))}>
            <FormInput field="title" label={{ text: '标题', required: true }} />
            <SchemaField field="profile" renderers={renderers} renderField={renderField} />
            <Button type="primary" htmlType="submit">
                提交
            </Button>
        </Form>
    );
}
