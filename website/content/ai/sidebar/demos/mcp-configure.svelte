<script lang="ts">
    import { MCPConfigure, type MCPConfigureOption } from '@fibrae/semi-ai-svelte';
    import { IconFigma, IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { Button, Form, FormInput, FormTextArea, Modal, type FormApi } from '@fibrae/semi-ui-svelte';

    interface McpFormValues {
        name: string;
        src: string;
        desc: string;
    }

    const containerStyle = 'display: flex; height: 500px; border: 1px solid var(--semi-color-border); border-radius: 8px; overflow: hidden; box-sizing: border-box';

    // icon only takes an image URL, so the built-in options get their icons from the icon snippet
    const builtinIcons: Record<string, typeof IconFigma> = {
        'Semi mcp': IconSemiLogo,
        figma: IconFigma,
    };

    const srcRules = [
        { required: true, message: '请输入 MCP 图标 URL' },
        {
            validator: (_rule: unknown, value: string) => /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?::\d+)?(?:\/[^\s]*)?$/i.test(value),
            message: '请输入有效的 MCP 图标 URL',
        },
    ];

    let index = 1;

    let visible = $state(true);
    let options = $state.raw<MCPConfigureOption[]>([
        {
            value: 'Semi mcp',
            label: 'Semi',
            configure: true,
            desc: '支持 Semi 的文档、源码搜索，辅助开发',
        },
        {
            value: 'figma',
            label: 'Figma',
            desc: 'Figma MCP Server 连接Figma与AI开发工具的功能。它通过标准化的模型上下文协MCP），将组件、变量等设计数据和上下文暴露给AI，从而实现从设计稿到代码的智能生成，显著提升开发效率。',
        },
    ]);
    let customOptions = $state.raw<MCPConfigureOption[]>([]);
    let modalVisible = $state(false);
    let formApi: FormApi<McpFormValues> | undefined;

    const handleOk = () => {
        formApi
            ?.validate()
            .then((values) => {
                customOptions = [
                    ...customOptions,
                    {
                        label: values.name,
                        icon: values.src,
                        value: `mcp-${index++}`,
                        desc: values.desc,
                    },
                ];
                modalVisible = false;
            })
            .catch((errors) => {
                console.log('errors', errors);
            });
    };

    const onConfigureClick = (_event: MouseEvent, option: MCPConfigureOption) => {
        console.log('configure click', option);
    };

    const onEditClick = (_event: MouseEvent, option: MCPConfigureOption) => {
        console.log('edit click', option);
    };
</script>

<div style={containerStyle}>
    <div style="flex-grow: 1; flex-shrink: 1; padding: 20px">
        <Button aria-pressed={visible} onclick={() => (visible = !visible)}>MCP 配置</Button>
    </div>
    <MCPConfigure bind:customOptions bind:options bind:visible onAddClick={() => (modalVisible = true)} {onConfigureClick} {onEditClick} resizable={false} style="width: 500px">
        {#snippet icon({ item })}
            {#if item.icon}
                <img alt="" src={item.icon} style="width: 100%; height: 100%" />
            {:else}
                {@const Icon = builtinIcons[item.value]}
                <Icon />
            {/if}
        {/snippet}
    </MCPConfigure>
    <Modal bind:visible={modalVisible} closeOnEsc onOk={handleOk} title="自定义 MCP">
        <Form getFormApi={(api) => (formApi = api)} layout="vertical" onValueChange={(values) => console.log(values)}>
            <FormInput field="name" label="MCP 名称" rules={[{ required: true, message: '请输入 MCP 名称' }]} style="width: 100%" />
            <FormInput field="src" initValue="/assets/placeholder/avatar-a.svg" label="MCP 图标 URL" rules={srcRules} style="width: 100%" />
            <FormTextArea field="desc" label="MCP 介绍" rules={[{ required: true, message: '请输入 MCP 介绍' }]} style="width: 100%" />
        </Form>
    </Modal>
</div>
