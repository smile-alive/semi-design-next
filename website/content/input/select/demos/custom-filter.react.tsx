import { Select, type SelectOptionProps } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const searchLabel = (sugInput: string, option: SelectOptionProps) => {
        let label = String(option.label).toUpperCase();
        let sug = sugInput.toUpperCase();
        return label.includes(sug);
    };
    return (
        <Select aria-label="业务线" filter={searchLabel} style={{ width: '180px' }} placeholder="try douyin">
            <Select.Option value="douyin">douyin</Select.Option>
            <Select.Option value="ulikecam">HOTSOON</Select.Option>
            <Select.Option value="jianying">PIPIXIA</Select.Option>
            <Select.Option value="xigua">XIGUA</Select.Option>
        </Select>
    );
}
