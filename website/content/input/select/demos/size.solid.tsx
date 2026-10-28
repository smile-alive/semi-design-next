import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="small" placeholder="请选择业务线" style={{ width: '180px' }} size="small">
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="default" placeholder="请选择业务线" style={{ width: '180px' }}>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="large" placeholder="请选择业务线" style={{ width: '180px' }} size="large">
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
        </>
    );
}
