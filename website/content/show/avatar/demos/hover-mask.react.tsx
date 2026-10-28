import { IconCamera } from '@fibrae/semi-icons-react';
import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    const style = {
        backgroundColor: 'var(--semi-color-overlay-bg)',
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    const hover = (
        <div style={style}>
            <IconCamera />
        </div>
    );

    return (
        <Avatar hoverMask={hover} color="red" alt="Bob Downton">
            BD
        </Avatar>
    );
}
