import { useState } from 'react';
import { Tabs, TabPane, Dropdown, type TabsProps } from '@fibrae/semi-ui-react';

const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const arrowStyle = {
    width: 32,
    height: 32,
    margin: '0 12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    border: 'none',
    borderRadius: '100%',
    background: 'var(--semi-grey-1)',
    color: 'var(--semi-color-text)',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    cursor: 'pointer',
};

export default function TabsDemo() {
    const [activeKey, setActiveKey] = useState('Tab-0');

    const renderArrow: TabsProps['renderArrow'] = (items, pos, handleArrowClick) => (
        <Dropdown
            render={
                <Dropdown.Menu>
                    {items.map((item) => (
                        <Dropdown.Item key={item.itemKey} onClick={() => setActiveKey(item.itemKey)}>
                            {item.itemKey}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            }
        >
            <button type="button" style={arrowStyle} onClick={handleArrowClick}>
                {pos === 'start' ? '←' : '→'}
            </button>
        </Dropdown>
    );

    return (
        <Tabs renderArrow={renderArrow} style={{ width: '50%', margin: '20px' }} activeKey={activeKey} type="card" collapsible onChange={setActiveKey}>
            {indexes.map((i) => (
                <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`} key={i}>
                    Content of card tab {i}
                </TabPane>
            ))}
        </Tabs>
    );
}
