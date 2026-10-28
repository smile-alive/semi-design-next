import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-solid';
import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return (
        <>
            <TagInput prefix={<IconVigoLogo />} />
            <br />
            <br />
            <TagInput prefix="Prefix" />
            <br />
            <br />
            <TagInput suffix={<IconGift />} />
            <br />
            <br />
            <TagInput suffix="Suffix" />
        </>
    );
}
