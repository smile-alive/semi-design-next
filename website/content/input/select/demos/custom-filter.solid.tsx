import { Select, type SelectOptionProps } from '@fibrae/semi-ui-solid';

function searchLabel(sugInput: string, option: SelectOptionProps) {
    return String(option.label).toUpperCase().includes(sugInput.toUpperCase());
}

export default function SelectDemo() {
    return (
        <Select aria-label="业务线" filter={searchLabel} style={{ width: '180px' }} placeholder="try douyin">
            <Select.Option value="douyin" label="douyin" />
            <Select.Option value="ulikecam" label="HOTSOON" />
            <Select.Option value="jianying" label="PIPIXIA" />
            <Select.Option value="xigua" label="XIGUA" />
        </Select>
    );
}
