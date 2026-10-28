import { createSignal } from 'solid-js';
import { Select, TagInput, type SelectTriggerRenderProps } from '@fibrae/semi-ui-solid';

const list = [
    { value: 'douyin', label: '抖音' },
    { value: 'ulikecam', label: '轻颜相机' },
    { value: 'jianying', label: '剪映' },
    { value: 'toutiao', label: '今日头条' },
];

export default function SelectDemo() {
    const [valList, setValList] = createSignal(['douyin', 'ulikecam']);
    const [inputVal, setInputVal] = createSignal('');

    const handleSort = (currentLabels: string[]) => {
        setValList(currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []));
    };

    const triggerRender = (props: SelectTriggerRenderProps) => (
        <div role="presentation" onKeyDown={(e) => e.stopPropagation()}>
            <TagInput
                draggable
                allowDuplicates={false}
                value={props.value.map((item) => String(item.label))}
                inputValue={inputVal()}
                onInputChange={(word) => {
                    props.onSearch(word);
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
            <Select aria-label="可拖拽排序的 Select" value={valList()} triggerRender={triggerRender} optionList={list} onChange={(value) => setValList(value)} multiple filter style={{ width: '240px' }} />
        </>
    );
}
