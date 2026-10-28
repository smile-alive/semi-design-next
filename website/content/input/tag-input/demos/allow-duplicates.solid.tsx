import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return <TagInput defaultValue={['抖音', '火山', '西瓜视频']} allowDuplicates={false} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
