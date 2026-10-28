import { For } from 'solid-js';
import { Popover, Tag, type TooltipPosition as Position } from '@fibrae/semi-ui-solid';

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

const article = () => (
    <article>
        Hi ByteDancer, this is a popover.
        <br /> We have 2 lines.
    </article>
);

export default function PopoverDemo() {
    return (
        <div style={{ 'padding-left': '40px' }} class="tag-margin-right">
            <div style={{ 'margin-left': '40px', 'white-space': 'nowrap' }}>
                <For each={tops}>
                    {([pos, label]) => (
                        <Popover showArrow content={article} position={pos}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', float: 'left' }}>
                <For each={lefts}>
                    {([pos, label]) => (
                        <Popover showArrow content={article} position={pos}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', 'margin-left': '180px' }}>
                <For each={rights}>
                    {([pos, label]) => (
                        <Popover showArrow content={article} position={pos}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ 'margin-left': '40px', clear: 'both', 'white-space': 'nowrap' }}>
                <For each={bottoms}>
                    {([pos, label]) => (
                        <Popover showArrow content={article} position={pos}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
        </div>
    );
}
