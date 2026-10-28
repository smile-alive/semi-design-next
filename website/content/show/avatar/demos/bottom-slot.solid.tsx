import { IconPlus } from '@fibrae/semi-icons-solid';
import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar
                color="amber"
                bottomSlot={{
                    shape: 'square',
                    bgColor: '#FE2C55',
                    text: '直播中',
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="large"
                bottomSlot={{
                    shape: 'square',
                    bgColor: '#FE2C55',
                    text: '直播中',
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="extra-large"
                bottomSlot={{
                    shape: 'square',
                    bgColor: '#FE2C55',
                    text: '直播中',
                }}
            >
                T
            </Avatar>
            <br />
            <br />
            <br />
            <Avatar
                color="amber"
                bottomSlot={{
                    shape: 'circle',
                    bgColor: '#FE2C55',
                    text: () => <IconPlus />,
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="large"
                bottomSlot={{
                    shape: 'circle',
                    bgColor: '#FE2C55',
                    text: () => <IconPlus />,
                }}
            >
                T
            </Avatar>

            <Avatar
                color="amber"
                size="extra-large"
                bottomSlot={{
                    shape: 'circle',
                    bgColor: '#FE2C55',
                    text: () => <IconPlus />,
                }}
            >
                T
            </Avatar>
        </div>
    );
}
