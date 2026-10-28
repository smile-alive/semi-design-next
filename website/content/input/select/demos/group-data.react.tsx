import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
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
    return (
        <Select aria-label="地区" placeholder="" style={{ width: 180 }} filter>
            {data.map((group, index) => (
                <Select.OptGroup label={group.label} key={`${index}-${group.label}`}>
                    {group.children.map((option, index2) => (
                        <Select.Option value={option.value} key={`${index2}-${group.label}`}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select.OptGroup>
            ))}
        </Select>
    );
}
