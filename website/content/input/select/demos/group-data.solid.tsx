import { For } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

const data = [
    {
        label: 'Asia',
        children: [
            { value: 'a-1', label: 'China' },
            { value: 'a-2', label: 'Korea' },
        ],
    },
    {
        label: 'Europe',
        children: [
            { value: 'b-1', label: 'Germany' },
            { value: 'b-2', label: 'France' },
        ],
    },
    {
        label: 'South America',
        children: [{ value: 'c-1', label: 'Peru' }],
    },
];

export default function SelectDemo() {
    return (
        <Select aria-label="地区" placeholder="" style={{ width: '180px' }} filter>
            <For each={data}>
                {(group) => (
                    <Select.OptGroup label={group.label}>
                        <For each={group.children}>{(option) => <Select.Option value={option.value} label={option.label} />}</For>
                    </Select.OptGroup>
                )}
            </For>
        </Select>
    );
}
