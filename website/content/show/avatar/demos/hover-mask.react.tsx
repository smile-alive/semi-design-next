import { IconCamera } from '@fibrae/semi-icons-react';
import { Avatar } from '@fibrae/semi-ui-react';

const overlayStyle = {
    backgroundColor: 'var(--semi-color-overlay-bg)',
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
