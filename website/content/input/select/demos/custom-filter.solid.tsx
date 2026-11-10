import { Select, type SelectOptionProps } from '@fibrae/semi-ui-solid';

function searchLabel(sugInput: string, option: SelectOptionProps) {
    return String(option.label).toUpperCase().includes(sugInput.toUpperCase());
}

export default function SelectDemo() {
    return (
        <Select aria-label="业务线" filter={searchLabel} style={{ width: '180px' }} placeholder="try video">
            <Select.Option value="video" label="video" />
            <Select.Option value="camera" label="LIVE" />
            <Select.Option value="editing" label="COMMUNITY" />
            <Select.Option value="movie" label="MOVIE" />
        </Select>
    );
}
