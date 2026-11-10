import { Tooltip, Tag, type TooltipPosition as Position } from '@fibrae/semi-ui-react';

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

export default function TooltipDemo() {
    return (
        <div>
            <div style={{ marginInlineStart: 80, whiteSpace: 'nowrap' }}>
                {tops.map(([position, label]) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi semi</p>
                                <p>hi semi</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={position}
                    >
                        <Tag style={{ margin: 8, padding: 20 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ width: 80, float: 'left' }}>
                {lefts.map(([position, label]) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi semi</p>
                                <p>hi semi</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={position}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ width: 40, marginInlineStart: 300 }}>
                {rights.map(([position, label]) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi semi</p>
                                <p>hi semi</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={position}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ marginInlineStart: 80, clear: 'both', whiteSpace: 'nowrap' }}>
                {bottoms.map(([position, label]) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi semi</p>
                                <p>hi semi</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={position}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
