import { For } from 'solid-js';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-solid/illustrations';
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
        description="一套组件，四个框架原生可用"
        style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
    />
);

export default function PopoverDemo() {
    return (
        <div>
            <div style={{ 'margin-inline-start': '80px', 'white-space': 'nowrap' }}>
                <For each={tops}>
                    {([position, label]) => (
                        <Popover content={article} position={position}>
                            <Tag style={{ margin: '8px', padding: '20px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '80px', float: 'left' }}>
                <For each={lefts}>
                    {([position, label]) => (
                        <Popover content={article} position={position}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ width: '40px', 'margin-inline-start': '300px' }}>
                <For each={rights}>
                    {([position, label]) => (
                        <Popover content={article} position={position}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
            <div style={{ 'margin-inline-start': '80px', clear: 'both', 'white-space': 'nowrap' }}>
                <For each={bottoms}>
                    {([position, label]) => (
                        <Popover content={article} position={position}>
                            <Tag style={{ margin: '8px', padding: '20px', width: '60px' }}>{label}</Tag>
                        </Popover>
                    )}
                </For>
            </div>
        </div>
    );
}
