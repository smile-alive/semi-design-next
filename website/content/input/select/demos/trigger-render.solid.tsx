import { createSignal } from 'solid-js';
import { IconAppCenter, IconChevronDown } from '@fibrae/semi-icons-solid';
import { Select, Tag, type SelectTriggerRenderProps } from '@fibrae/semi-ui-solid';

const list = [
    { value: 'douyin', label: '抖音' },
    { value: 'ulikecam', label: '轻颜相机' },
    { value: 'jianying', label: '剪映' },
    { value: 'toutiao', label: '今日头条' },
];

const triggerRender = (props: SelectTriggerRenderProps) => (
    <div
        style={{
            'min-width': '112px',
            'background-color': 'var(--semi-color-primary-light-default)',
            height: '32px',
            display: 'flex',
            'align-items': 'center',
            'padding-left': '12px',
            'border-radius': '3px',
            color: 'var(--semi-color-primary)',
        }}
    >
        <div style={{ 'font-weight': 600, 'flex-shrink': 0, 'font-size': '14px' }}>业务线</div>
        <div
            style={{
                margin: '4px',
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                'flex-grow': 1,
                overflow: 'hidden',
            }}
        >
            {props.value.map((item) => item.label).join(' , ')}
        </div>
        <IconAppCenter style={{ 'margin-right': '8px', 'flex-shrink': 0 }} />
    </div>
);

const triggerRender2 = (props: SelectTriggerRenderProps) => (
    <div
        style={{
            margin: '4px',
            'white-space': 'nowrap',
            'text-overflow': 'ellipsis',
            'flex-grow': 1,
            overflow: 'hidden',
            display: 'flex',
            'align-items': 'center',
        }}
    >
        <Tag size="large" color="cyan" shape="circle" suffixIcon={<IconChevronDown />}>
            {props.value.map((item) => item.label).join(' / ')}
        </Tag>
    </div>
);

export default function SelectDemo() {
    const [valList, setValList] = createSignal(['douyin', 'ulikecam']);
    return (
        <div>
            <h4>不同背景色的触发器</h4>
            <Select aria-label="不同背景色的触发器" value={valList()} triggerRender={triggerRender} optionList={list} onChange={(value) => setValList(value)} multiple filter searchPosition="dropdown" style={{ width: '240px' }} />
            <br />
            <br />
            <h4>使用 circle Tag 作为触发器</h4>
            <Select aria-label="circle Tag 触发器" value={valList()} onChange={(value) => setValList(value)} triggerRender={triggerRender2} optionList={list} filter multiple searchPosition="dropdown" style={{ width: '240px', 'margin-top': '20px', outline: 0 }} />
        </div>
    );
}
