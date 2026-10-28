import { Avatar, Badge } from '@fibrae/semi-ui-solid';

const bgStyle = {
    padding: '8px',
};

const style = {
    width: '42px',
    height: '42px',
    'border-radius': '4px',
};

const invertedBgStyle = {
    padding: '8px',
    'border-radius': '4px',
    'background-color': 'var(--semi-color-fill-0)',
};

export default function BadgeDemo() {
    return (
        <div style={{ display: 'flex' }}>
            <div style={bgStyle}>
                <Badge count={5} theme="solid">
                    <Avatar color="indigo" shape="square" style={style}>
                        XZ
                    </Avatar>
                </Badge>
            </div>
            <div style={bgStyle}>
                <Badge count={5} theme="light">
                    <Avatar color="indigo" shape="square" style={style}>
                        YB
                    </Avatar>
                </Badge>
            </div>
            <div style={bgStyle}>
                <Badge count={5} theme="inverted">
                    <Avatar color="light-green" shape="square" style={style}>
                        LX
                    </Avatar>
                </Badge>
            </div>
            <br />
            <div style={bgStyle}>
                <Badge dot theme="solid">
                    <Avatar color="light-green" shape="square" style={style}>
                        YZ
                    </Avatar>
                </Badge>
            </div>
            <div style={bgStyle}>
                <Badge dot theme="light">
                    <Avatar color="lime" shape="square" style={style}>
                        HW
                    </Avatar>
                </Badge>
            </div>
            <div style={invertedBgStyle}>
                <Badge dot theme="inverted">
                    <Avatar color="lime" shape="square" style={style}>
                        XM
                    </Avatar>
                </Badge>
            </div>
        </div>
    );
}
