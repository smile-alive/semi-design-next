import { useState } from 'react';
import clsx from 'clsx';
import { Select, Checkbox, Highlight, type SelectOptionRenderProps } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const [inputValue, setInputValue] = useState('');
    const renderOptionItem = ({ id, disabled, selected, label, focused, className, style, onMouseEnter, onClick }: SelectOptionRenderProps) => {
        const optionCls = clsx(className, {
            ['custom-option-render']: true,
            ['custom-option-render-focused']: focused,
            ['custom-option-render-disabled']: disabled,
            ['custom-option-render-selected']: selected,
        });
        const searchWords = [inputValue];

        // Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from props;
        // bind onMouseEnter and className on the outer DOM or arrow keys display wrongly; put id there so screen
        // readers announce the option the arrow keys reach

        return (
            <div id={id} role="option" aria-selected={selected} aria-disabled={disabled} style={style} className={optionCls} onClick={onClick} onMouseEnter={onMouseEnter}>
                <Checkbox checked={selected} />
                <div className="option-right">
                    <Highlight sourceString={label as string} searchWords={searchWords} />
                </div>
            </div>
        );
    };

    const optionList = [
        { value: 'douyin', label: '抖音', otherKey: 0 },
        { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
        { value: 'jianying', label: '剪映', otherKey: 2 },
        { value: 'toutiao', label: '今日头条', otherKey: 3 },
    ];

    return (
        <>
            <Select aria-label="单选" filter placeholder="单选" onSearch={(v) => setInputValue(v)} dropdownClassName="components-select-demo-renderOptionItem" optionList={optionList} style={{ width: 180 }} renderOptionItem={renderOptionItem} />
            <br />
            <br />
            <Select aria-label="多选" filter placeholder="多选" multiple onSearch={(v) => setInputValue(v)} dropdownClassName="components-select-demo-renderOptionItem" optionList={optionList} style={{ width: 320 }} renderOptionItem={renderOptionItem} />
        </>
    );
}
