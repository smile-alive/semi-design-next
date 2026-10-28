import { useState } from 'react';
import { Select, TagInput, type SelectTriggerRenderProps } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const [valList, setValList] = useState(['douyin', 'ulikecam']);
    const [inputVal, setInputVal] = useState('');
    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];

    const handleSort = (currentLabels: string[]) => {
        const newValue = currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []);
        setValList(newValue);
    };

    const triggerRender = ({ value, onSearch }: SelectTriggerRenderProps) => {
        return (
            <div role="presentation" onKeyDown={(e) => e.stopPropagation()}>
                <TagInput
                    draggable
                    allowDuplicates={false}
                    value={value.map((item) => String(item.label))}
                    inputValue={inputVal}
                    onInputChange={(word) => {
                        onSearch(word);
                        setInputVal(word);
                    }}
                    onChange={handleSort}
                    showClear
                />
            </div>
        );
    };

    return (
        <>
            <h4>可对已选项拖拽重新排序的 Select </h4>
            <Select aria-label="可拖拽排序的 Select" value={valList} triggerRender={triggerRender} optionList={list} onChange={(value) => setValList(value)} multiple filter style={{ width: 240 }} />
        </>
    );
}
