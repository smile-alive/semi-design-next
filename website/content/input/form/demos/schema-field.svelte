<script lang="ts">
    import * as z from 'zod';
    import { Button, Form, FormInput, FormRating, SchemaField, Toast, type SchemaFieldRenderProps } from '@fibrae/semi-ui-svelte';
    import UrlField from './parts/url-field.svelte';

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
</script>

{#snippet score(context: SchemaFieldRenderProps)}
    <FormRating field={context.field} label={{ text: context.node.title, required: context.node.required }} />
{/snippet}

<Form onSubmit={(values) => Toast.success(JSON.stringify(values))} {schema} style="width: 480px">
    <FormInput field="title" label={{ text: '标题', required: true }} />
    <SchemaField field="profile" renderField={{ 'profile.score': score }} widgets={{ uri: UrlField }} />
    <Button htmlType="submit" type="primary">提交</Button>
</Form>
