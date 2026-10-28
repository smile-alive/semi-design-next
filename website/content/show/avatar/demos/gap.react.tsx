import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: 4 }}>AS</Avatar>
            <Avatar style={{ margin: 4 }} gap={4}>
                Semi
            </Avatar>
            <Avatar style={{ margin: 4 }} gap={10}>
                Semi
            </Avatar>
        </div>
    );
}
