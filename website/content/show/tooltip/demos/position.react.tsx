import { Tooltip, Tag, type TooltipPosition as Position } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
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

    return (
        <div>
            <div style={{ marginLeft: 80, whiteSpace: 'nowrap' }}>
                {tops.map(([position, label], index) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi bytedance</p>
                                <p>hi bytedance</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={index}
                    >
                        <Tag style={{ margin: 8, padding: 20 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ width: 80, float: 'left' }}>
                {lefts.map(([position, label], index) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi bytedance</p>
                                <p>hi bytedance</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={index}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ width: 40, marginLeft: 300 }}>
                {rights.map(([position, label], index) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi bytedance</p>
                                <p>hi bytedance</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={index}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
            <div style={{ marginLeft: 80, clear: 'both', whiteSpace: 'nowrap' }}>
                {bottoms.map(([position, label], index) => (
                    <Tooltip
                        content={
                            <article>
                                <p>hi bytedance</p>
                                <p>hi bytedance</p>
                            </article>
                        }
                        arrowPointAtCenter={false}
                        position={position}
                        key={index}
                    >
                        <Tag style={{ margin: 8, padding: 20, width: 60 }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
