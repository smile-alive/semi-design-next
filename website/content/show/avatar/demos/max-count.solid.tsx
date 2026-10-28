import { Avatar, AvatarGroup } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <AvatarGroup maxCount={3}>
                <Avatar color="red" alt="Lisa LeBlanc">
                    LL
                </Avatar>
                <Avatar alt="Caroline Xiao">CX</Avatar>
                <Avatar color="amber" alt="Rafal Matin">
                    RM
                </Avatar>
                <Avatar style={{ color: '#f56a00', 'background-color': '#fde3cf' }} alt="Zank Lance">
                    ZL
                </Avatar>
                <Avatar style={{ 'background-color': '#87d068' }} alt="Youself Zhang">
                    YZ
                </Avatar>
            </AvatarGroup>
        </div>
    );
}
