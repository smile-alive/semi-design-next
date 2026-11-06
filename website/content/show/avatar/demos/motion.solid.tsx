import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar color="amber" border={{ motion: true }} style={{ 'margin-inline-end': '8px' }} contentMotion>
                T
            </Avatar>

            <Avatar color="amber" border={{ motion: true }} size="large" style={{ 'margin-inline-end': '8px' }} contentMotion>
                T
            </Avatar>

            <Avatar color="amber" border={{ motion: true }} size="extra-large" style={{ 'margin-inline-end': '8px' }} contentMotion>
                T
            </Avatar>
        </div>
    );
}
