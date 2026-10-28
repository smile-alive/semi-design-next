import { Select, Toast } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="Select 示例" multiple style={{ width: '320px' }} defaultValue={['douyin', 'ulikecam']}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" multiple maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} style={{ width: '320px' }} defaultValue={['douyin', 'ulikecam', 'jianying']}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>

            <br />
            <br />
            <Select aria-label="Select 示例" multiple style={{ width: '320px' }} defaultValue={['douyin']} max={2} onExceed={() => Toast.warning('最多只允许选择两项')}>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" multiple maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} style={{ width: '220px' }} defaultValue={['xigua', 'ulikecam', 'jianying', 'douyin']} ellipsisTrigger expandRestTagsOnClick>
                <Select.Option value="douyin">抖音</Select.Option>
                <Select.Option value="ulikecam">轻颜相机</Select.Option>
                <Select.Option value="jianying">剪映</Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </>
    );
}
