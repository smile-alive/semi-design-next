import { type Component, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { AIChatInput } from '@fibrae/semi-ai-solid';
import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-solid';
import { Radio, RadioGroup } from '@fibrae/semi-ui-solid';

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
    const [round, setRound] = createSignal(false);

    const renderLeftMenu = () => (
        <>
            <Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
            <Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                联网搜索
            </Configure.Button>
            <Configure.Mcp options={mcpOptions} renderOptionIcon={(option) => <Dynamic component={mcpIcons[option.value]} />} />
            <Configure.RadioButton options={radioButtonProps} field="mode" initValue="fast" />
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
