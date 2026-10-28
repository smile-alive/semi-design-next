import { AvatarGroup, Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <AvatarGroup>
                <Avatar color="red" alt="Lisa LeBlanc">
                    LL
                </Avatar>
                <Avatar alt="Caroline Xiao">CX</Avatar>
                <Avatar color="amber" alt="Rafal Matin">
                    RM
                </Avatar>
                <Avatar style={{ color: '#f56a00', backgroundColor: '#fde3cf' }} alt="Zank Lance">
                    ZL
                </Avatar>
                <Avatar style={{ backgroundColor: '#87d068' }} alt="Youself Zhang">
                    YZ
                </Avatar>
            </AvatarGroup>
        </div>
    );
}
