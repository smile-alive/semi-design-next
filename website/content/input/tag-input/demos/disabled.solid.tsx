import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return <TagInput disabled showClear defaultValue={['短视频', '直播', '长视频']} placeholder="请输入..." />;
}
