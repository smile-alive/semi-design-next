import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return <TagInput draggable allowDuplicates={false} defaultValue={['抖音', '火山', '西瓜视频']} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
