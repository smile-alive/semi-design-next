import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-react/illustrations';
import { Popover, Tag, Empty, type TooltipPosition as Position } from '@fibrae/semi-ui-react';

const tops: [Position, string][] = [
    ['topLeft', 'TL'],
    ['top', 'Top'],
    ['topRight', 'TR'],
];
const lefts: [Position, string][] = [
    ['leftTop', 'LT'],
    ['left', 'Left'],
    ['leftBottom', 'LB'],
];
const rights: [Position, string][] = [
    ['rightTop', 'RT'],
    ['right', 'Right'],
    ['rightBottom', 'RB'],
];
const bottoms: [Position, string][] = [
    ['bottomLeft', 'BL'],
    ['bottom', 'Bottom'],
    ['bottomRight', 'BR'],
];

const article = <Empty title="先进的设计 / 研发协作方式" image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="一套组件，四个框架原生可用" style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }} />;

export default function PopoverDemo() {
    return (
        <div>
            <div style={{ marginInlineStart: 80, whiteSpace: 'nowrap' }}>
                {tops.map(([position, label]) => (
                    <Popover content={article} position={position} key={position}>
                        <Tag style={{ margin: 8, padding: 20 }}>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ width: 80, float: 'left' }}>
                {lefts.map(([position, label]) => (
                    <Popover content={article} position={position} key={position}>
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ width: 40, marginInlineStart: 300 }}>
                {rights.map(([position, label]) => (
                    <Popover content={article} position={position} key={position}>
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ marginInlineStart: 80, clear: 'both', whiteSpace: 'nowrap' }}>
                {bottoms.map(([position, label]) => (
                    <Popover content={article} position={position} key={position}>
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Popover>
                ))}
            </div>
        </div>
    );
}
