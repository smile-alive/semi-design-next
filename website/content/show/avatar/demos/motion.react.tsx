import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar color="amber" border={{ motion: true }} style={{ marginInlineEnd: '8px' }} contentMotion>
                T
            </Avatar>

            <Avatar color="amber" border={{ motion: true }} size="large" style={{ marginInlineEnd: '8px' }} contentMotion>
                T
            </Avatar>

            <Avatar color="amber" border={{ motion: true }} size="extra-large" style={{ marginInlineEnd: '8px' }} contentMotion>
                T
            </Avatar>
        </div>
    );
}
