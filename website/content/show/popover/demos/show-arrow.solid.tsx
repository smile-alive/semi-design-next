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
        Hi Semi, this is a popover.
        <br /> We have 2 lines.
    </article>
);

export default function PopoverDemo() {
    return (
        <div style={{ 'padding-inline-start': '40px' }} class="tag-margin-right">
            <div style={{ 'margin-inline-start': '40px', 'white-space': 'nowrap' }}>
                <For each={tops}>
                    {([position, label]) => (
                        <Popover showArrow content={article} position={position}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', float: 'left' }}>
                <For each={lefts}>
                    {([position, label]) => (
                        <Popover showArrow content={article} position={position}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', 'margin-inline-start': '180px' }}>
                <For each={rights}>
                    {([position, label]) => (
                        <Popover showArrow content={article} position={position}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ 'margin-inline-start': '40px', clear: 'both', 'white-space': 'nowrap' }}>
                <For each={bottoms}>
                    {([position, label]) => (
                        <Popover showArrow content={article} position={position}>
                            <Tag>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
        </div>
    );
}
