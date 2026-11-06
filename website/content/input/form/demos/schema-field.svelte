<script lang="ts">
    import * as z from 'zod';
    import { Button, Form, FormInput, FormRadioGroup, SchemaField, type SchemaFieldRenderProps } from '@fibrae/semi-ui-svelte';
    import UrlField from './parts/url-field.svelte';

    const schema = z.object({
        name: z.string({ error: '请输入项目名' }).min(2, '项目名至少 2 个字符'),
        profile: z
            .object({
                homepage: z.url('请输入有效的网址').meta({ title: '主页' }),
                summary: z.string().max(80, '最多 80 个字符').optional().meta({ title: '一句话介绍' }),
                license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0']).meta({ title: '许可证' }),
            })
            .meta({ title: '项目资料' }),
    });

    let output = $state<z.output<typeof schema>>();
</script>

{#snippet license({ field, node }: SchemaFieldRenderProps)}
    <FormRadioGroup {field} label={{ text: node.title, required: node.required }} options={node.options} type="button" />
{/snippet}

<Form onSubmit={(values) => (output = values)} {schema} style="width: 480px">
    <FormInput field="name" label={{ text: '项目名', required: true }} />
    <SchemaField field="profile" renderField={{ 'profile.license': license }} widgets={{ uri: UrlField }} />
    <Button htmlType="submit" type="primary">提交</Button>
    {#if output}
        <pre>{JSON.stringify(output, null, 2)}</pre>
    {/if}
</Form>
