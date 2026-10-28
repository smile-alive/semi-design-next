import { Popover, Tag, type TooltipPosition as Position } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
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
        <div style={{ paddingLeft: 40 }} className="tag-margin-right">
            <div style={{ marginLeft: 40, whiteSpace: 'nowrap' }}>
                {tops.map(([position, label]) => (
                    <Popover
                        showArrow
                        arrowPointAtCenter
                        content={
                            <article>
                                Hi ByteDancer, this is a popover.
                                <br /> We have 2 lines.
                            </article>
                        }
                        position={position}
                        key={position}
                    >
                        <Tag>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ width: 40, float: 'left' }}>
                {lefts.map(([position, label]) => (
                    <Popover
                        showArrow
                        arrowPointAtCenter
                        content={
                            <article>
                                Hi ByteDancer, this is a popover.
                                <br /> We have 2 lines.
                            </article>
                        }
                        position={position}
                        key={position}
                    >
                        <Tag>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ width: 40, marginLeft: 180 }}>
                {rights.map(([position, label]) => (
                    <Popover
                        showArrow
                        arrowPointAtCenter
                        content={
                            <article>
                                Hi ByteDancer, this is a popover.
                                <br /> We have 2 lines.
                            </article>
                        }
                        position={position}
                        key={position}
                    >
                        <Tag>{label}</Tag>
                    </Popover>
                ))}
            </div>
            <div style={{ marginLeft: 40, clear: 'both', whiteSpace: 'nowrap' }}>
                {bottoms.map(([position, label]) => (
                    <Popover
                        showArrow
                        arrowPointAtCenter
                        content={
                            <article>
                                Hi ByteDancer, this is a popover.
                                <br /> We have 2 lines.
                            </article>
                        }
                        position={position}
                        key={position}
                    >
                        <Tag>{label}</Tag>
                    </Popover>
                ))}
            </div>
        </div>
    );
}
