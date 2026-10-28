import { IconVigoLogo, IconGift } from '@fibrae/semi-icons-react';
import { TagInput } from '@fibrae/semi-ui-react';

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
