import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return <TagInput defaultValue={['短视频', '直播', '长视频']} allowDuplicates={false} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
