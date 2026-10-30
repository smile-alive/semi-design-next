import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { AIChatInput, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-solid';
import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-solid';

const { Configure } = AIChatInput;
const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

const modelOptions = [
    { value: 'GPT-5', label: 'GPT-5' },
    { value: 'GPT-4o', label: 'GPT-4o' },
    { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
];

const radioButtonProps = [
    { label: '极速', value: 'fast' },
    { label: '思考', value: 'think' },
    { label: '超能', value: 'super' },
];

function onConfigureButtonClick() {
    console.log('onConfigureButtonClick');
}

function onConfigureChange(value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) {
    console.log('onConfigureChange', value, changedValue);
}

const mcpOptions = [
    { label: '飞书文档', value: 'feishu' },
    { label: 'Github Mcp', value: 'github' },
    { label: 'IconFigma Mcp', value: 'IconFigma' },
];

const mcpIcons: Record<string, Component> = {
    feishu: IconFeishuLogo,
    github: IconGit,
    IconFigma,
};

export default function AIChatInputDemo() {
    const renderLeftMenu = () => (
        <>
            <Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
            <Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                联网搜索
            </Configure.Button>
            <Configure.Mcp options={mcpOptions} renderOptionIcon={(option) => <Dynamic component={mcpIcons[option.value]} />} onConfigureButtonClick={onConfigureButtonClick} showConfigure />
            <Configure.RadioButton options={radioButtonProps} field="thinkType" initValue="fast" />
        </>
    );

    return <AIChatInput placeholder="用于查看左下方配置项的用例" renderConfigureArea={renderLeftMenu} onConfigureChange={onConfigureChange} uploadProps={uploadProps} style={outerStyle} />;
}
