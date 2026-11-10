import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-solid';
import { Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="Select 示例" style={{ width: '320px' }} defaultValue="camera" prefix={<IconVigoLogo />} showClear>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" style={{ width: '320px' }} defaultValue="camera" prefix={<IconVigoLogo />} suffix={<IconGift />} showArrow={false}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
        </>
    );
}
