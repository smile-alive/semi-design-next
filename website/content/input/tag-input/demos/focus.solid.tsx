import { Button, TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    let tagInput: HTMLDivElement | undefined;

    return (
        <>
            <TagInput defaultValue={['抖音', '火山']} ref={(node) => (tagInput = node)} />
            <Button style={{ 'margin-top': '10px' }} onClick={() => tagInput?.focus()}>
                点击按钮聚焦
            </Button>
        </>
    );
}
