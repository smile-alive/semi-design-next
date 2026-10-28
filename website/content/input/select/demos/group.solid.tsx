import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <Select aria-label="地区" placeholder="" style={{ width: '180px' }} filter>
            <Select.OptGroup label="Asia">
                <Select.Option value="a-1" label="China" />
                <Select.Option value="a-2" label="Korea" />
            </Select.OptGroup>
            <Select.OptGroup label="Europe">
                <Select.Option value="b-1" label="Germany" />
                <Select.Option value="b-2" label="France" />
            </Select.OptGroup>
            <Select.OptGroup label="South America">
                <Select.Option value="c-1" label="Peru" />
            </Select.OptGroup>
        </Select>
    );
}
