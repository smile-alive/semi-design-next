import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return (
        <>
            <TagInput size="small" placeholder="small" />
            <br />
            <br />
            <TagInput placeholder="default" />
            <br />
            <br />
            <TagInput size="large" placeholder="large" />
        </>
    );
}
