import { useState } from 'react';
import clsx from 'clsx';
import { Select, Checkbox, Highlight, type SelectOptionRenderProps } from '@fibrae/semi-ui-react';

const optionList = [
    { value: 'video', label: '短视频', otherKey: 0 },
    { value: 'camera', label: '相机', disabled: true, otherKey: 1 },
    { value: 'editing', label: '剪辑', otherKey: 2 },
    { value: 'news', label: '资讯', otherKey: 3 },
];

export default function SelectDemo() {
    const [inputValue, setInputValue] = useState('');

    // Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from props;
    // bind onMouseEnter and className on the outer DOM or arrow keys display wrongly; put id there so screen
    // readers announce the option the arrow keys reach
    const renderOptionItem = (item: SelectOptionRenderProps) => (
        <div
            id={item.id}
            role="option"
            aria-selected={item.selected}
            aria-disabled={item.disabled}
            style={item.style}
            className={clsx(item.className, 'custom-option-render', {
                'custom-option-render-focused': item.focused,
                'custom-option-render-disabled': item.disabled,
                'custom-option-render-selected': item.selected,
            })}
            onClick={item.onClick}
            onMouseEnter={item.onMouseEnter}
        >
            <Checkbox checked={item.selected} />
            <div className="option-right">
                <Highlight sourceString={String(item.label)} searchWords={[inputValue]} />
            </div>
        </div>
    );

    return (
        <>
            <Select aria-label="单选" filter placeholder="单选" onSearch={(v) => setInputValue(v)} classNames={{ dropdown: 'components-select-demo-renderOptionItem' }} optionList={optionList} style={{ width: 180 }} renderOptionItem={renderOptionItem} />
            <br />
            <br />
            <Select aria-label="多选" filter placeholder="多选" multiple onSearch={(v) => setInputValue(v)} classNames={{ dropdown: 'components-select-demo-renderOptionItem' }} optionList={optionList} style={{ width: 320 }} renderOptionItem={renderOptionItem} />
        </>
    );
}
