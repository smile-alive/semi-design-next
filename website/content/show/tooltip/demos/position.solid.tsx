import { For } from 'solid-js';
import { Tag, Tooltip, type TooltipPosition } from '@fibrae/semi-ui-solid';

type Item = [TooltipPosition, string];

const tops: Item[] = [
    ['topLeft', 'TL'],
    ['top', 'Top'],
    ['topRight', 'TR'],
];
const lefts: Item[] = [
    ['leftTop', 'LT'],
    ['left', 'Left'],
    ['leftBottom', 'LB'],
];
const rights: Item[] = [
    ['rightTop', 'RT'],
    ['right', 'Right'],
    ['rightBottom', 'RB'],
];
const bottoms: Item[] = [
    ['bottomLeft', 'BL'],
    ['bottom', 'Bottom'],
    ['bottomRight', 'BR'],
];

function Tips(props: { items: Item[]; width?: string }) {
    return (
        <For each={props.items}>
            {([position, label]) => (
                <Tooltip
                    content={
                        <article>
                            <p>hi bytedance</p>
                            <p>hi bytedance</p>
                        </article>
                    }
                    arrowPointAtCenter={false}
                    position={position}
                >
                    {(trigger) => (
                        <Tag style={{ margin: '8px', padding: '20px', width: props.width }} {...trigger()}>
                            {label}
                        </Tag>
                    )}
                </Tooltip>
            )}
        </For>
    );
}

export default function TooltipDemo() {
    return (
        <div>
            <div style={{ 'margin-left': '80px', 'white-space': 'nowrap' }}>
                <Tips items={tops} />
            </div>
            <div style={{ width: '80px', float: 'left' }}>
                <Tips items={lefts} width="60px" />
            </div>
            <div style={{ width: '40px', 'margin-left': '300px' }}>
                <Tips items={rights} width="60px" />
            </div>
            <div style={{ 'margin-left': '80px', clear: 'both', 'white-space': 'nowrap' }}>
                <Tips items={bottoms} width="60px" />
            </div>
        </div>
    );
}
