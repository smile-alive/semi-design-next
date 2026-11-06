import { For } from 'solid-js';
import { Tag, Tooltip, type TooltipPosition as Position } from '@fibrae/semi-ui-solid';

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
            <div style={{ 'margin-inline-start': '80px', 'white-space': 'nowrap' }}>
                <For each={tops}>
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
                                <Tag style={{ margin: '8px', padding: '20px' }} {...trigger()}>
                                    {label}
                                </Tag>
                            )}
                        </Tooltip>
                    )}
                </For>
            </div>
            <div style={{ width: '80px', float: 'left' }}>
                <For each={lefts}>
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
                                <Tag style={{ margin: '8px', padding: '20px', width: '60px' }} {...trigger()}>
                                    {label}
                                </Tag>
                            )}
                        </Tooltip>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', 'margin-inline-start': '300px' }}>
                <For each={rights}>
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
                                <Tag style={{ margin: '8px', padding: '20px', width: '60px' }} {...trigger()}>
                                    {label}
                                </Tag>
                            )}
                        </Tooltip>
                    )}
                </For>
            </div>
            <div style={{ 'margin-inline-start': '80px', clear: 'both', 'white-space': 'nowrap' }}>
                <For each={bottoms}>
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
                                <Tag style={{ margin: '8px', padding: '20px', width: '60px' }} {...trigger()}>
                                    {label}
                                </Tag>
                            )}
                        </Tooltip>
                    )}
                </For>
            </div>
        </div>
    );
}
