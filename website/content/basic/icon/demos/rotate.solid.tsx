import { IconHome, IconEmoji, IconSpin } from '@fibrae/semi-icons-solid';

export default function IconDemo() {
    return (
        <div>
            <IconHome size="small" />
            <IconEmoji rotate={180} />
            <IconSpin spin />
        </div>
    );
}
