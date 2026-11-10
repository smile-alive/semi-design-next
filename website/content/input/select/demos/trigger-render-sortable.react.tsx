import { useState } from 'react';
import { Select, TagInput, type SelectTriggerRenderProps } from '@fibrae/semi-ui-react';

const list = [
    { value: 'video', label: '短视频' },
    { value: 'camera', label: '相机' },
    { value: 'editing', label: '剪辑' },
    { value: 'news', label: '资讯' },
];

export default function SelectDemo() {
    const [valList, setValList] = useState(['video', 'camera']);
    const [inputVal, setInputVal] = useState('');

    const handleSort = (currentLabels: string[]) => {
        setValList(currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []));
    };

    const triggerRender = (selectState: SelectTriggerRenderProps) => (
        <div role="presentation" onKeyDown={(e) => e.stopPropagation()}>
            <TagInput
                draggable
                allowDuplicates={false}
                value={selectState.value.map((item) => String(item.label))}
                inputValue={inputVal}
                onInputChange={(word) => {
                    selectState.onSearch(word);
                    setInputVal(word);
                }}
                onChange={handleSort}
                showClear
            />
        </div>
    );

    return (
        <>
            <h4>可对已选项拖拽重新排序的 Select </h4>
            <Select aria-label="可拖拽排序的 Select" value={valList} triggerRender={triggerRender} optionList={list} onChange={(value) => setValList(value)} multiple filter style={{ width: 240 }} />
        </>
    );
}
