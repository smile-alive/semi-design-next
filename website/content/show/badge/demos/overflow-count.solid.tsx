import { Avatar, Badge } from '@fibrae/semi-ui-solid';

const style = {
    width: '42px',
    height: '42px',
    'border-radius': '4px',
};

export default function BadgeDemo() {
    return (
        <div>
            <Badge count={99}>
                <Avatar color="teal" shape="square" style={style}>
                    ZH
                </Avatar>
            </Badge>
            <br />
            <br />
            <Badge count={100}>
                <Avatar color="teal" shape="square" style={style}>
                    HS
                </Avatar>
            </Badge>
            <br />
            <br />
            <Badge count={99} overflowCount={10}>
                <Avatar color="green" shape="square" style={style}>
                    DY
                </Avatar>
            </Badge>
            <br />
            <br />
            <Badge count={1000} overflowCount={999}>
                <Avatar color="green" shape="square" style={style}>
                    TT
                </Avatar>
            </Badge>
        </div>
    );
}
