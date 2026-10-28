import { createSignal, For } from 'solid-js';
import { Tabs, TabPane, Dropdown, type TabsProps } from '@fibrae/semi-ui-solid';

const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const arrowStyle = {
    width: '32px',
    height: '32px',
    margin: '0 12px',
    display: 'flex',
    'justify-content': 'center',
    'align-items': 'center',
    padding: '0',
    border: 'none',
    'border-radius': '100%',
    background: 'var(--semi-grey-1)',
    color: 'var(--semi-color-text)',
    'font-family': 'inherit',
    'font-size': 'inherit',
    cursor: 'pointer',
};

export default function TabsDemo() {
    const [activeKey, setActiveKey] = createSignal('Tab-0');

    const renderArrow: TabsProps['renderArrow'] = (items, pos, handleArrowClick) => (
        <Dropdown
            render={
                <Dropdown.Menu>
                    <For each={items}>{(item) => <Dropdown.Item onClick={() => setActiveKey(item.itemKey)}>{item.itemKey}</Dropdown.Item>}</For>
                </Dropdown.Menu>
            }
        >
            {(trigger) => (
                <button type="button" {...trigger()} style={arrowStyle} onClick={handleArrowClick}>
                    {pos === 'start' ? '←' : '→'}
                </button>
            )}
        </Dropdown>
    );

    return (
        <Tabs renderArrow={renderArrow} style={{ width: '50%', margin: '20px' }} activeKey={activeKey()} type="card" collapsible onChange={setActiveKey}>
            <For each={indexes}>
                {(i) => (
                    <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`}>
                        Content of card tab {i}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}
