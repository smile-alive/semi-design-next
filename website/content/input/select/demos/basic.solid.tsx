import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="业务线" defaultValue="video" style={{ width: '120px' }}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing" disabled>
                    剪辑
                </Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="业务线" defaultValue="video" disabled style={{ width: '120px' }}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="业务线" placeholder="请选择业务线" style={{ width: '120px' }}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing" disabled>
                    剪辑
                </Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
        </>
    );
}
