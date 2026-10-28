import { createSignal } from 'solid-js';
import clsx from 'clsx';
import { Checkbox, Highlight, Select, type SelectOptionRenderProps } from '@fibrae/semi-ui-solid';

const optionList = [
    { value: 'douyin', label: '抖音', otherKey: 0 },
    { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
    { value: 'jianying', label: '剪映', otherKey: 2 },
    { value: 'toutiao', label: '今日头条', otherKey: 3 },
];

export default function SelectDemo() {
    const [inputValue, setInputValue] = createSignal('');

    // Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from props;
    // bind onMouseEnter and class on the outer DOM or arrow keys display wrongly; put id there so screen
    // readers announce the option the arrow keys reach
    const renderOptionItem = (props: SelectOptionRenderProps) => (
        <div
            id={props.id}
            role="option"
            aria-selected={props.selected}
            aria-disabled={props.disabled}
            style={props.style}
            class={clsx(props.class, 'custom-option-render', {
                'custom-option-render-focused': props.focused,
                'custom-option-render-disabled': props.disabled,
                'custom-option-render-selected': props.selected,
            })}
            onClick={(e) => props.onClick(e)}
            onMouseEnter={(e) => props.onMouseEnter(e)}
        >
            <Checkbox checked={props.selected} />
            <div class="option-right">
                <Highlight sourceString={String(props.label)} searchWords={[inputValue()]} />
            </div>
        </div>
    );

    return (
        <>
            <Select aria-label="单选" filter placeholder="单选" onSearch={(v) => setInputValue(v)} dropdownClassName="components-select-demo-renderOptionItem" optionList={optionList} style={{ width: '180px' }} renderOptionItem={renderOptionItem} />
            <br />
            <br />
            <Select aria-label="多选" filter placeholder="多选" multiple onSearch={(v) => setInputValue(v)} dropdownClassName="components-select-demo-renderOptionItem" optionList={optionList} style={{ width: '320px' }} renderOptionItem={renderOptionItem} />
        </>
    );
}
