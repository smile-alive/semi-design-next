import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const newOptions = Array.from({ length: 3000 }, (_v, i) => ({ label: `option-${i}`, value: i }));
    let virtualize = {
        height: 270,
        width: '100%',
        itemSize: 36, // px
    };
    return <Select aria-label="virtualize" placeholder="拥有3k个Option的Select" style={{ width: 260 }} filter virtualize={virtualize} optionList={newOptions} />;
}
