import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <Select aria-label="业务线" placeholder="自定义弹出层样式的" style={{ width: 180 }} dropdownStyle={{ width: 250 }} dropdownClassName="test">
            <Select.Option value="douyin">抖音</Select.Option>
            <Select.Option value="ulikecam">轻颜相机</Select.Option>
            <Select.Option value="jianying">剪映</Select.Option>
            <Select.Option value="xigua">西瓜视频</Select.Option>
        </Select>
    );
}
