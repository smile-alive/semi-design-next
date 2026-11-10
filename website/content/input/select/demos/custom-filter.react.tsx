import { Select, type SelectOptionProps } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const searchLabel = (sugInput: string, option: SelectOptionProps) => {
        const label = String(option.label).toUpperCase();
        const sug = sugInput.toUpperCase();
        return label.includes(sug);
    };
    return (
        <Select aria-label="业务线" filter={searchLabel} style={{ width: '180px' }} placeholder="try video">
            <Select.Option value="video">video</Select.Option>
            <Select.Option value="camera">LIVE</Select.Option>
            <Select.Option value="editing">COMMUNITY</Select.Option>
            <Select.Option value="movie">MOVIE</Select.Option>
        </Select>
    );
}
