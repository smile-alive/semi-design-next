import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar alt="漂亮的猫咪" src="/assets/placeholder/avatar-a.svg" style={{ margin: 4 }} />
            <Avatar alt="可爱的猫咪" size="small" src="/assets/placeholder/avatar-a.svg" style={{ margin: 4 }} />
        </div>
    );
}
