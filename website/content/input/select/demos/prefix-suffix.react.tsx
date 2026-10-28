import { IconVigoLogo, IconGift } from '@fibrae/semi-icons-react';
import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="Select 示例" style={{ width: '320px' }} defaultValue="ulikecam" prefix={<IconVigoLogo />} showClear>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" style={{ width: '320px' }} defaultValue="ulikecam" prefix={<IconVigoLogo />} suffix={<IconGift />} showArrow={false}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </>
    );
}
