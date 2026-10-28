import { Avatar } from '@fibrae/semi-ui-solid';

export default function AvatarDemo() {
    return (
        <div>
            <Avatar style={{ margin: '4px' }} alt="Alice Swift">
                AS
            </Avatar>
            <Avatar color="red" style={{ margin: '4px' }} alt="Bob Matteo">
                BM
            </Avatar>
            <Avatar color="light-blue" style={{ margin: '4px' }} alt="Taylor Joy">
                TJ
            </Avatar>
            <Avatar style={{ color: '#f56a00', 'background-color': '#fde3cf', margin: '4px' }} alt="Zank Lance">
                ZL
            </Avatar>
            <Avatar style={{ 'background-color': '#87d068', margin: '4px' }} alt="Youself Zhang">
                YZ
            </Avatar>
        </div>
    );
}
