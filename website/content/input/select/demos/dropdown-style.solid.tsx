import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <Select aria-label="业务线" placeholder="自定义弹出层样式的" style={{ width: '180px' }} classNames={{ dropdown: 'test' }} styles={{ dropdown: { width: '250px' } }}>
            <Select.Option value="video">短视频</Select.Option>
            <Select.Option value="camera">相机</Select.Option>
            <Select.Option value="editing">剪辑</Select.Option>
            <Select.Option value="movie">长视频</Select.Option>
        </Select>
    );
}
