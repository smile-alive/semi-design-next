import { Select, Toast } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="Select 示例" multiple style={{ width: '320px' }} defaultValue={['video', 'camera']}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" multiple maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} style={{ width: '320px' }} defaultValue={['video', 'camera', 'editing']}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>

            <br />
            <br />
            <Select aria-label="Select 示例" multiple style={{ width: '320px' }} defaultValue={['video']} max={2} onExceed={() => Toast.warning('最多只允许选择两项')}>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
            <br />
            <br />
            <Select aria-label="Select 示例" multiple maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} style={{ width: '220px' }} defaultValue={['movie', 'camera', 'editing', 'video']} ellipsisTrigger expandRestTagsOnClick>
                <Select.Option value="video">短视频</Select.Option>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="editing">剪辑</Select.Option>
                <Select.Option value="movie">长视频</Select.Option>
            </Select>
        </>
    );
}
