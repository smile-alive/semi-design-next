import { useState, useCallback, useRef, type CSSProperties, type MouseEvent, type RefObject } from 'react';
import { MCPConfigure, type MCPConfigureOption as MCPOption } from '@fibrae/semi-ai-react';
import { IconSemiLogo, IconFigma } from '@fibrae/semi-icons-react';
import { Button, Modal, Form, type FormHandle } from '@fibrae/semi-ui-react';

interface McpFormValues {
    name: string;
    src: string;
    desc: string;
}

interface CustomOptionCreateModelProps {
    visible: boolean;
    handleOk: () => void;
    handleCancel: () => void;
    formRef: RefObject<FormHandle<McpFormValues> | null>;
}

const defaultOptions: MCPOption[] = [
    {
        icon: <IconSemiLogo />,
        value: 'Semi mcp',
        label: 'Semi',
        configure: true,
        desc: '支持 Semi 的文档、源码搜索，辅助开发',
    },
    {
        icon: <IconFigma />,
        value: 'figma',
        label: 'Figma',
        desc: 'Figma MCP Server 连接Figma与AI开发工具的功能。它通过标准化的模型上下文协MCP），将组件、变量等设计数据和上下文暴露给AI，从而实现从设计稿到代码的智能生成，显著提升开发效率。',
    },
];

function CustomOptionCreateModel({ visible, handleOk, handleCancel, formRef }: CustomOptionCreateModelProps) {
    return (
        <Modal title="自定义 MCP" visible={visible} onOk={handleOk} onCancel={handleCancel} closeOnEsc>
            <Form ref={formRef} layout="vertical" onValueChange={(values) => console.log(values)}>
                <Form.Input rules={[{ required: true, message: '请输入 MCP 名称' }]} field="name" label="MCP 名称" style={{ width: '100%' }} />
                <Form.Input
                    initValue="/assets/placeholder/avatar-a.svg"
                    rules={[
                        { required: true, message: '请输入 MCP 图标 URL' },
                        {
                            validator: (_rule, value) => {
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
                <Form.TextArea rules={[{ required: true, message: '请输入 MCP 介绍' }]} field="desc" label="MCP 介绍" style={{ width: '100%' }} />
            </Form>
        </Modal>
    );
}

let index = 1;

const containerStyle: CSSProperties = {
    display: 'flex',
    height: '500px',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 8,
    overflow: 'hidden',
    boxSizing: 'border-box',
};

export default function SidebarDemo() {
    const [visible, setVisible] = useState(true);
    const toggleVisible = useCallback(() => {
        setVisible((visible) => !visible);
    }, []);
    const [options, setOptions] = useState(defaultOptions);
    const [mVisible, setMVisible] = useState(false);
    const [customOptions, setCustomOptions] = useState<MCPOption[]>([]);
    const formRef = useRef<FormHandle<McpFormValues>>(null);

    const handleOk = useCallback(() => {
        formRef.current?.formApi
            .validate()
            .then((values) => {
                const newOptions = [
                    ...customOptions,
                    {
                        label: values.name,
                        icon: values.src,
                        value: `mcp-${index++}`,
                        desc: values.desc,
                    },
                ];
                setCustomOptions(newOptions);
                setMVisible(false);
            })
            .catch((errors) => {
                console.log('errors', errors);
            });
    }, [customOptions]);

    const showDialog = useCallback(() => {
        setMVisible(true);
    }, []);

    const handleCancel = useCallback(() => {
        setMVisible(false);
    }, []);

    const onStatusChange = useCallback((options: MCPOption[], custom: boolean) => {
        if (custom) {
            setCustomOptions(options);
        } else {
            setOptions(options);
        }
    }, []);

    const onAddClick = useCallback(() => {
        showDialog();
    }, [showDialog]);

    const onConfigureClick = useCallback((_e: MouseEvent, option: MCPOption) => {
        console.log('configure click', option);
    }, []);

    const onEditClick = useCallback((_e: MouseEvent, option: MCPOption) => {
        console.log('edit click', option);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ flexGrow: 1, flexShrink: 1, padding: 20 }}>
                <Button aria-pressed={visible} onClick={toggleVisible}>
                    MCP 配置
                </Button>
            </div>
            <MCPConfigure style={{ width: 500 }} resizable={false} visible={visible} onCancel={toggleVisible} options={options} customOptions={customOptions} onStatusChange={onStatusChange} onAddClick={onAddClick} onConfigureClick={onConfigureClick} onEditClick={onEditClick} />
            <CustomOptionCreateModel formRef={formRef} visible={mVisible} handleOk={handleOk} handleCancel={handleCancel} />
        </div>
    );
}
