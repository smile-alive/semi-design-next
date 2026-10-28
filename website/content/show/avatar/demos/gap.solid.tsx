import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: '4px' }}>AS</Avatar>
            <Avatar style={{ margin: '4px' }} gap={4}>
                Semi
            </Avatar>
            <Avatar style={{ margin: '4px' }} gap={10}>
                Semi
            </Avatar>
        </div>
    );
}
