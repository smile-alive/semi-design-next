import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return <TagInput maxTagCount={2} showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} defaultValue={['抖音', '火山', '西瓜视频']} onChange={(v) => console.log(v)} />;
}
