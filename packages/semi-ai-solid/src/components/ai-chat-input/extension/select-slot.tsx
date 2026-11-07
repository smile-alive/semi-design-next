import { createMemo } from 'solid-js';
import Select from '@fibrae/semi-ui-solid/select/index';
import type { SlotViewProps } from './node-view';

export default function SelectSlotView(props: SlotViewProps) {
    const options = createMemo(() => (JSON.parse((props.node().attrs.options as string) || '[]') as string[]).map((option) => ({ value: option, label: option })));

    const handleChange = (value: unknown) => {
        if (typeof value === 'string') {
            props.updateAttributes({ value });
        }
    };

    return (
        <span class="select-slot-wrapper" style={{ 'white-space': 'normal' }}>
            <Select class="select-slot" value={(props.node().attrs.value as string | null) ?? ''} optionList={options()} onChange={handleChange} />
        </span>
    );
}
