import { useRef } from 'react';
import { TagInput, Button, type TagInputHandle } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const ref = useRef<TagInputHandle>(null);
    const handleTagInputFocus = () => {
        ref.current?.focus();
    };

    return (
        <>
            <TagInput defaultValue={['抖音', '火山']} ref={ref} />
            <Button style={{ marginTop: 10 }} onClick={handleTagInputFocus}>
                点击按钮聚焦
            </Button>
        </>
    );
}
