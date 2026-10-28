import { useState } from 'react';
import { IconAppCenter, IconChevronDown } from '@fibrae/semi-icons-react';
import { Select, Tag, type SelectTriggerRenderProps } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const [valList, setValList] = useState(['douyin', 'ulikecam']);
    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
    const triggerRender = ({ value }: SelectTriggerRenderProps) => {
        return (
            <div
                style={{
                    minWidth: '112px',
                    backgroundColor: 'var(--semi-color-primary-light-default)',
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    borderRadius: 3,
                    color: 'var(--semi-color-primary)',
                }}
            >
                <div
                    style={{
                        fontWeight: 600,
                        flexShrink: 0,
                        fontSize: 14,
                    }}
                >
                    业务线
                </div>
                <div
                    style={{
                        margin: 4,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        flexGrow: 1,
                        overflow: 'hidden',
                    }}
                >
                    {value.map((item) => item.label).join(' , ')}
                </div>
                <IconAppCenter style={{ marginRight: 8, flexShrink: 0 }} />
            </div>
        );
    };

    const triggerRender2 = ({ value }: SelectTriggerRenderProps) => {
        return (
            <div
                style={{
                    margin: 4,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    flexGrow: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Tag size="large" color="cyan" shape="circle" suffixIcon={<IconChevronDown />}>
                    {value.map((item) => item.label).join(' / ')}
                </Tag>
            </div>
        );
    };

    return (
        <div>
            <h4>不同背景色的触发器</h4>
            <Select aria-label="不同背景色的触发器" value={valList} triggerRender={triggerRender} optionList={list} onChange={(value) => setValList(value)} multiple filter searchPosition="dropdown" style={{ width: 240 }} />
            <br />
            <br />
            <h4>使用 circle Tag 作为触发器</h4>
            <Select aria-label="circle Tag 触发器" value={valList} onChange={(value) => setValList(value)} triggerRender={triggerRender2} optionList={list} filter multiple searchPosition="dropdown" style={{ width: 240, marginTop: 20, outline: 0 }} />
        </div>
    );
}
