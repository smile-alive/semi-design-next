import { For } from 'solid-js';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Popover, Tag, Empty, type TooltipPosition as Position } from '@fibrae/semi-ui-solid';

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
    <Empty
        title="先进的设计 / 研发协作方式"
        image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />}
        darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />}
        description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
        style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
    />
);

export default function PopoverDemo() {
    return (
        <div>
            <div style={{ 'margin-left': '80px', 'white-space': 'nowrap' }}>
                <For each={tops}>
                    {([pos, label]) => (
                        <Popover content={article} position={pos}>
                            <Tag style={{ margin: '8px', padding: '20px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '80px', float: 'left' }}>
                <For each={lefts}>
                    {([pos, label]) => (
                        <Popover content={article} position={pos}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', 'margin-left': '300px' }}>
                <For each={rights}>
                    {([pos, label]) => (
                        <Popover content={article} position={pos}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ 'margin-left': '80px', clear: 'both', 'white-space': 'nowrap' }}>
                <For each={bottoms}>
                    {([pos, label]) => (
                        <Popover content={article} position={pos}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
        </div>
    );
}
