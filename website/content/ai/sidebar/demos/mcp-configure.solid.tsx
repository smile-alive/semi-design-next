import { type Component, type JSX, Show, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { MCPConfigure, type MCPConfigureOption as MCPOption } from '@fibrae/semi-ai-solid';
import { IconFigma, IconSemiLogo } from '@fibrae/semi-icons-solid';
import { Button, Form, FormInput, FormTextArea, Modal, type FormHandle } from '@fibrae/semi-ui-solid';

interface McpFormValues {
    name: string;
    src: string;
    desc: string;
}

// icon only takes an image URL, so the built-in options get their icons from renderIcon
const builtinIcons: Record<string, Component> = {
    'Semi mcp': IconSemiLogo,
    figma: IconFigma,
};

const imageStyle: JSX.CSSProperties = { width: '100%', height: '100%' };

const defaultOptions: MCPOption[] = [
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
];

let index = 1;

const containerStyle: JSX.CSSProperties = {
    display: 'flex',
    height: '500px',
    border: '1px solid var(--semi-color-border)',
    'border-radius': '8px',
    overflow: 'hidden',
    'box-sizing': 'border-box',
};

export default function SidebarDemo() {
    const [visible, setVisible] = createSignal(true);
    const [options, setOptions] = createSignal(defaultOptions);
    const [mVisible, setMVisible] = createSignal(false);
    const [customOptions, setCustomOptions] = createSignal<MCPOption[]>([]);
    let form: FormHandle<McpFormValues> | undefined;

    const toggleVisible = () => setVisible((current) => !current);

    const handleOk = () => {
        form?.formApi
            .validate()
            .then((values) => {
                setCustomOptions((current) => [
                    ...current,
                    {
                        label: values.name,
                        icon: values.src,
                        value: `mcp-${index++}`,
                        desc: values.desc,
                    },
                ]);
                setMVisible(false);
            })
            .catch((errors) => {
                console.log('errors', errors);
            });
    };

    const onStatusChange = (changed: MCPOption[], custom: boolean) => {
        if (custom) {
            setCustomOptions(changed);
        } else {
            setOptions(changed);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={{ 'flex-grow': 1, 'flex-shrink': 1, padding: '20px' }}>
                <Button aria-pressed={visible()} onClick={toggleVisible}>
                    MCP 配置
                </Button>
            </div>
            <MCPConfigure
                style={{ width: '500px' }}
                resizable={false}
                visible={visible()}
                onCancel={toggleVisible}
                options={options()}
                customOptions={customOptions()}
                onStatusChange={onStatusChange}
                onAddClick={() => setMVisible(true)}
                onConfigureClick={(_e, option) => console.log('configure click', option)}
                onEditClick={(_e, option) => console.log('edit click', option)}
                renderIcon={({ option }) => (
                    <Show when={option.icon} fallback={<Dynamic component={builtinIcons[option.value]} />}>
                        {(src) => <img alt="" src={src()} style={imageStyle} />}
                    </Show>
                )}
            />
            <Modal title="自定义 MCP" visible={mVisible()} onOk={handleOk} onCancel={() => setMVisible(false)} closeOnEsc>
                <Form ref={(node) => (form = node)} layout="vertical" onValueChange={(values) => console.log(values)}>
                    <FormInput rules={[{ required: true, message: '请输入 MCP 名称' }]} field="name" label="MCP 名称" style={{ width: '100%' }} />
                    <FormInput
                        initValue="/assets/placeholder/avatar-a.svg"
                        rules={[
                            { required: true, message: '请输入 MCP 图标 URL' },
                            {
                                validator: (_rule: unknown, value: string) => {
                                    const urlRegex = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?::\d+)?(?:\/[^\s]*)?$/i;
                                    return urlRegex.test(value);
                                },
                                message: '请输入有效的 MCP 图标 URL',
                            },
                        ]}
                        field="src"
                        label="MCP 图标 URL"
                        style={{ width: '100%' }}
                    />
                    <FormTextArea rules={[{ required: true, message: '请输入 MCP 介绍' }]} field="desc" label="MCP 介绍" style={{ width: '100%' }} />
                </Form>
            </Modal>
        </div>
    );
}
