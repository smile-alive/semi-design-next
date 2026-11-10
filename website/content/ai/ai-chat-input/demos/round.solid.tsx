import { type Component, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { AIChatInput } from '@fibrae/semi-ai-solid';
import { IconBookOpenStroked, IconGit, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-solid';
import { Radio, RadioGroup } from '@fibrae/semi-ui-solid';
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
    const [round, setRound] = createSignal(false);

    const renderLeftMenu = () => (
        <>
            <AIChatInput.Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
            <AIChatInput.Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                联网搜索
            </AIChatInput.Configure.Button>
            <AIChatInput.Configure.Mcp options={mcpOptions} renderOptionIcon={(option) => <Dynamic component={mcpIcons[option.value]} />} />
            <AIChatInput.Configure.RadioButton options={radioButtonProps} field="mode" initValue="fast" />
        </>
    );

    return (
        <>
            <RadioGroup onChange={(event) => setRound(event.target.value)} value={round()} aria-label="单选组合示例" name="demo-radio-group">
                <Radio value>圆形</Radio>
                <Radio value={false}>方形</Radio>
            </RadioGroup>
            <AIChatInput placeholder="下方按钮为方形的用例" round={round()} renderConfigureArea={renderLeftMenu} uploadProps={uploadProps} style={outerStyle} />
        </>
    );
}
