import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="default" style={{ width: '180px' }}>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="warning" style={{ width: '180px' }} validateStatus="warning">
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="error" style={{ width: '180px' }} validateStatus="error">
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
        </>
    );
}
