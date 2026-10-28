import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return (
        <>
            <TagInput placeholder="default" />
            <br />
            <br />
            <TagInput placeholder="warning" validateStatus="warning" />
            <br />
            <br />
            <TagInput placeholder="error" validateStatus="error" />
        </>
    );
}
