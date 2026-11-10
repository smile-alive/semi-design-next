import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return <TagInput draggable allowDuplicates={false} defaultValue={['短视频', '直播', '长视频']} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
