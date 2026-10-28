import { createSignal } from 'solid-js';
import { IconTreeTriangleDown } from '@fibrae/semi-icons-solid';
import { Button, Dropdown, SplitButtonGroup, type DropDownMenuItem } from '@fibrae/semi-ui-solid';

const menu: DropDownMenuItem[] = [
    { node: 'item', name: '编辑项目', onClick: () => console.log('编辑项目点击') },
    { node: 'item', name: '重置项目' },
    { node: 'divider' },
    { node: 'item', name: '复制项目' },
    { node: 'item', name: '从项目创建模版' },
    { node: 'divider' },
    { node: 'item', name: '删除项目', type: 'danger' },
];

export default function ButtonDemo() {
    const [btnVisible, setBtnVisible] = createSignal<Record<number, boolean>>({ 1: false, 2: false, 3: false });

    const handleVisibleChange = (key: number, visible: boolean) => setBtnVisible((prev) => ({ ...prev, [key]: visible }));

    return (
        <div>
            <SplitButtonGroup style={{ 'margin-right': '10px' }} aria-label="项目操作按钮组">
                <Button theme="solid" type="primary">
                    分裂按钮
                </Button>
                <Dropdown onVisibleChange={(v) => handleVisibleChange(1, v)} menu={menu} trigger="click" position="bottomRight">
                    {(trigger) => <Button {...trigger()} style={btnVisible()[1] ? { background: 'var(--semi-color-primary-hover)', padding: '8px 4px' } : { padding: '8px 4px' }} theme="solid" type="primary" aria-label="更多操作" icon={<IconTreeTriangleDown />} />}
                </Dropdown>
            </SplitButtonGroup>
            <SplitButtonGroup style={{ 'margin-right': '10px' }} aria-label="项目操作按钮组">
                <Button theme="light" type="primary">
                    分裂按钮
                </Button>
                <Dropdown onVisibleChange={(v) => handleVisibleChange(2, v)} menu={menu} trigger="click" position="bottomRight">
                    {(trigger) => <Button {...trigger()} style={btnVisible()[2] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }} theme="light" type="primary" aria-label="更多操作" icon={<IconTreeTriangleDown />} />}
                </Dropdown>
            </SplitButtonGroup>
            <SplitButtonGroup aria-label="项目操作按钮组">
                <Button style={btnVisible()[3] ? { background: 'var(--semi-color-fill-0)' } : {}} theme="borderless" type="primary">
                    分裂按钮
                </Button>
                <Dropdown onVisibleChange={(v) => handleVisibleChange(3, v)} menu={menu} trigger="click" position="bottomRight">
                    {(trigger) => <Button {...trigger()} style={btnVisible()[3] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }} theme="borderless" type="primary" aria-label="更多操作" icon={<IconTreeTriangleDown />} />}
                </Dropdown>
            </SplitButtonGroup>
        </div>
    );
}
