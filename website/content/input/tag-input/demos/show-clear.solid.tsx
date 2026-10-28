import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return <TagInput showClear defaultValue={['抖音', '火山']} placeholder="请输入..." onChange={(v) => console.log(v)} />;
}
