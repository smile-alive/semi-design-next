import { IconLikeHeart, IconFlag, IconLock, IconUnlock } from '@fibrae/semi-icons-react';

export default function IconDemo() {
    return (
        <div>
            <div style={{ color: '#E91E63' }}>
                <IconLikeHeart size="extra-large" />
                <IconFlag size="extra-large" />
            </div>
            <br />
            <div>
                <IconLock style={{ color: '#6A3AC7' }} size="extra-large" />
                <IconUnlock style={{ color: '#9C27B0' }} size="extra-large" />
            </div>
        </div>
    );
}
