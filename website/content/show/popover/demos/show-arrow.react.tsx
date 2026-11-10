import { Popover, Tag, type TooltipPosition as Position } from '@fibrae/semi-ui-react';

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

export default function PopoverDemo() {
    return (
        <div style={{ paddingInlineStart: 40 }} className="tag-margin-right">
            <div style={{ marginInlineStart: 40, whiteSpace: 'nowrap' }}>
                {tops.map(([position, label]) => (
                    <Popover
                        showArrow
                        content={
                            <article>
                                Hi Semi, this is a popover.
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
                        content={
                            <article>
                                Hi Semi, this is a popover.
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
            <div style={{ width: 40, marginInlineStart: 180 }}>
                {rights.map(([position, label]) => (
                    <Popover
                        showArrow
                        content={
                            <article>
                                Hi Semi, this is a popover.
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
            <div style={{ marginInlineStart: 40, clear: 'both', whiteSpace: 'nowrap' }}>
                {bottoms.map(([position, label]) => (
                    <Popover
                        showArrow
                        content={
                            <article>
                                Hi Semi, this is a popover.
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
