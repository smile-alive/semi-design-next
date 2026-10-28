import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar
                color="amber"
                topSlot={{
                    text: '直播',
                    gradientStart: 'rgb(255,23,100)',
                    gradientEnd: 'rgb(237,52,148)',
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="large"
                topSlot={{
                    text: '直播',
                    gradientStart: 'rgb(255,23,100)',
                    gradientEnd: 'rgb(237,52,148)',
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="extra-large"
                topSlot={{
                    text: '直播',
                    gradientStart: 'rgb(255,23,100)',
                    gradientEnd: 'rgb(237,52,148)',
                }}
            >
                T
            </Avatar>
        </div>
    );
}
