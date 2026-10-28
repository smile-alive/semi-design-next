import { useState, useCallback, useRef, type MouseEvent } from 'react';
import { AIChatInput, type AIChatInputHandle, type AIChatInputSkill as Skill } from '@fibrae/semi-ai-react';
import { IconTemplateStroked, IconSearch } from '@fibrae/semi-icons-react';

const { Configure } = AIChatInput;
const modelOptions = [
    { value: 'GPT-5', label: 'GPT-5' },
    { value: 'GPT-4o', label: 'GPT-4o' },
    { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
];
const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };
const skills = [
    {
        icon: <IconTemplateStroked />,
        value: 'writing',
        label: '帮我写作',
        hasTemplate: true,
    },
    {
        icon: <IconSearch />,
        value: 'AI 编程',
        label: 'AI coding',
    },
];

const template = [
    {
        group: '工作',
        children: [
            {
                bg: 'var(--semi-color-primary)',
                icon: <IconTemplateStroked />,
                title: '总结汇报',
                desc: '凝练你的工作成效',
                content: `我的职业是<input-slot placeholder="[请输入职业]"></input-slot>，帮我写一份关于<input-slot placeholder="[输入目的：项目进展总结、团队工作成果或其他]"></input-slot>的总结汇报`,
            },
            {
                bg: 'var(--semi-color-warning)',
                icon: <IconTemplateStroked />,
                title: '话术',
                desc: '满足不同场景表达需求',
                content: `我是一名<select-slot value="打工人" options='["打工人","学生"]'></select-slot> ，帮我写一段面向<input-slot placeholder="[输入对象]">陌生同事</input-slot>的话术内容`,
            },
        ],
    },
    {
        group: '商业营销',
        children: [
            {
                bg: 'var(--semi-color-primary)',
                icon: <IconTemplateStroked />,
                title: '宣传文案',
                desc: '撰写各平台的推广文案',
                content: '帮我写一篇面向<input-slot placeholder="[输入目标人群]"></input-slot>职场人士，关于<input-slot placeholder="[输入产品]"></input-slot>的宣传文案，需要直击痛点，吸引用户点击。',
            },
            {
                bg: 'var(--semi-color-warning)',
                icon: <IconTemplateStroked />,
                title: '方案策划',
                desc: '量身定制各种方案',
                content: '我是一名<input-slot placeholder="[输入职业]"></input-slot>职业策划人 ，帮我写一个<input-slot placeholder="[方案类型：如线下读书会活动方案等]"></input-slot>线下读书会活动 的方案，需要包含但不限于策划目标、详细计划、所需资源和预算、效果评估、风险应对等。',
            },
        ],
    },
];

interface TemplateContentProps {
    onTemplateClick: (content: string) => void;
}

const TemplateContent = ({ onTemplateClick: onTemplateClickProps }: TemplateContentProps) => {
    const [groupIndex, setGroupIndex] = useState(0);

    const onItemClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        const index = e.currentTarget.dataset.index;
        setGroupIndex(Number(index));
    }, []);

    const onTemplateClick = useCallback(
        ({ content }: { content: string }) => {
            onTemplateClickProps(content);
        },
        [onTemplateClickProps]
    );

    return (
        <div className="aiChatInput-template">
            <div className="template-header">
                {template.map((item, index) => {
                    return (
                        <button type="button" key={index} data-index={index} className={`template-header-item ${groupIndex === index ? 'template-header-item-active' : ''}`} style={{ border: 'none', fontFamily: 'inherit' }} onClick={onItemClick}>
                            {item.group}
                        </button>
                    );
                })}
            </div>
            <div className="template-content">
                {(template[groupIndex]?.children ?? []).map((item, index) => (
                    <button type="button" key={index} className="template-content-item" style={{ font: 'inherit', textAlign: 'left' }} onClick={() => onTemplateClick(item)}>
                        <span className="template-content-item-icon" style={{ background: item.bg }}>
                            {item.icon}
                        </span>
                        <span className="template-content-item-title">{item.title}</span>
                        <span className="template-content-item-desc">{item.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function AIChatInputDemo() {
    const ref = useRef<AIChatInputHandle>(null);

    const setTemplate = useCallback(
        (content: string) => {
            const element = ref.current;
            if (!element) {
                return;
            }
            element.setContentWhileSaveTool(content);
            element.focusEditor();
        },
        [ref]
    );

    const renderTemplate = useCallback(
        (skill?: Skill) => {
            if (skill?.value === 'writing') {
                return <TemplateContent onTemplateClick={setTemplate} />;
            }
        },
        [setTemplate]
    );

    const renderLeftMenu = useCallback(
        () => (
            <>
                <Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
            </>
        ),
        []
    );

    return <AIChatInput placeholder="输入 / 唤起技能，选择技能后，点击模版按钮可查看模版，可通过鼠标上下按键切换侯选项" renderConfigureArea={renderLeftMenu} ref={ref} uploadProps={uploadProps} skills={skills} skillHotKey="/" renderTemplate={renderTemplate} style={outerStyle} />;
}
