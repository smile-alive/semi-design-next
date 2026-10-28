import { IconCamera } from '@fibrae/semi-icons-solid';
import { Avatar } from '@fibrae/semi-ui-solid';

const overlayStyle = {
    'background-color': 'var(--semi-color-overlay-bg)',
    height: '100%',
    width: '100%',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
};

export default function AvatarDemo() {
    return (
        <Avatar
            hoverMask={
                <div style={overlayStyle}>
                    <IconCamera />
                </div>
            }
            color="red"
            alt="Bob Downton"
        >
            BD
        </Avatar>
    );
}
