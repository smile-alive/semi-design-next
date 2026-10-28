import { IconPlus } from '@fibrae/semi-icons-solid';
import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <Avatar
            alt="beautiful cat"
            src="/assets/placeholder/avatar-a.svg"
            style={{ margin: '4px' }}
            size="large"
            border={{ color: '#FE2C55', motion: true }}
            contentMotion
            topSlot={{
                text: '直播',
                gradientStart: 'rgb(255,23,100)',
                gradientEnd: 'rgb(237,52,148)',
            }}
            bottomSlot={{
                shape: 'circle',
                bgColor: '#FE2C55',
                text: () => <IconPlus />,
            }}
        />
    );
}
