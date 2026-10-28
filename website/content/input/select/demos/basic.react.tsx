import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="业务线" defaultValue="douyin" style={{ width: 120 }}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying" disabled>
                    剪映
                </Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="业务线" defaultValue="douyin" disabled style={{ width: 120 }}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="业务线" placeholder="请选择业务线" style={{ width: 120 }}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying" disabled>
                    剪映
                </Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </>
    );
}
