import { Avatar } from '@fibrae/semi-ui-react';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: 4 }} alt="Alice Swift">
                AS
            </Avatar>
            <Avatar color="red" style={{ margin: 4 }} alt="Bob Matteo">
                BM
            </Avatar>
            <Avatar color="light-blue" style={{ margin: 4 }} alt="Taylor Joy">
                TJ
            </Avatar>
            <Avatar style={{ color: '#f56a00', backgroundColor: '#fde3cf', margin: 4 }} alt="Zank Lance">
                ZL
            </Avatar>
            <Avatar style={{ backgroundColor: '#87d068', margin: 4 }} alt="Youself Zhang">
                YZ
            </Avatar>
        </div>
    );
}
