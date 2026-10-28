import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: 4 }} alt="用户">
                U
            </Avatar>
            <Avatar shape="square" style={{ margin: 4 }} alt="用户">
                U
            </Avatar>
        </div>
    );
}
