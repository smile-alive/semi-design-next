import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: '4px' }} alt="用户">
                U
            </Avatar>
            <Avatar shape="square" style={{ margin: '4px' }} alt="用户">
                U
            </Avatar>
        </div>
    );
}
