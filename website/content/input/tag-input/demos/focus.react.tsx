import { useRef } from 'react';
import { TagInput, Button, type TagInputHandle } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const ref = useRef<TagInputHandle>(null);
    const handleTagInputFocus = () => {
        ref.current?.focus();
    };

    return (
        <>
            <TagInput defaultValue={['短视频', '直播']} ref={ref} />
            <Button style={{ marginBlockStart: 10 }} onClick={handleTagInputFocus}>
                点击按钮聚焦
            </Button>
        </>
    );
}
