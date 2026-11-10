import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return <TagInput showClear defaultValue={['短视频', '直播']} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
