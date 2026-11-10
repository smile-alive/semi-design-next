import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return <TagInput maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} defaultValue={['短视频', '直播', '长视频']} onChange={(v) => console.log(v)} />;
}
