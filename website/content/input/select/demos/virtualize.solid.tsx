import { Select } from '@fibrae/semi-ui-solid';

const newOptions = Array.from({ length: 3000 }, (_, i) => ({ label: `option-${i}`, value: i }));
const virtualize = {
    height: 270,
    width: '100%',
    itemSize: 36, // px
};

export default function SelectDemo() {
    return <Select aria-label="virtualize" placeholder="拥有3k个Option的Select" style={{ width: '260px' }} filter virtualize={virtualize} optionList={newOptions} />;
}
