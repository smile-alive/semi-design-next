import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { AIChatInput, type AIChatInputSetup as Setup } from '@fibrae/semi-ai-solid';
import { IconBookOpenStroked, IconGit, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-solid';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
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

function onConfigureChange(value: Setup, changedValue?: Setup) {
    console.log('onConfigureChange', value, changedValue);
}

const mcpOptions = [
    { label: '办公文档', value: 'office' },
    { label: 'Github Mcp', value: 'github' },
    { label: 'Design Mcp', value: 'design' },
];

const mcpIcons: Record<string, Component> = {
    office: IconWord,
    github: IconGit,
    design: IconTemplateStroked,
};

export default function AIChatInputDemo() {
    const renderLeftMenu = () => (
        <>
            <AIChatInput.Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
            <AIChatInput.Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                联网搜索
            </AIChatInput.Configure.Button>
            <AIChatInput.Configure.Mcp options={mcpOptions} renderOptionIcon={(option) => <Dynamic component={mcpIcons[option.value]} />} onConfigureButtonClick={onConfigureButtonClick} showConfigure />
            <AIChatInput.Configure.RadioButton options={radioButtonProps} field="thinkType" initValue="fast" />
        </>
    );

    return <AIChatInput placeholder="用于查看左下方配置项的用例" renderConfigureArea={renderLeftMenu} onConfigureChange={onConfigureChange} uploadProps={uploadProps} style={outerStyle} />;
}
