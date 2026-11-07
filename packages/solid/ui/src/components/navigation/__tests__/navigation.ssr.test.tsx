import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Nav, { type NavItems, type NavProps } from '..';

it('折叠的子菜单里的 items 图标不创建', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>leaf icon</b>;
    };
    const { html, errors } = await renderServer({
        render: () => <Nav items={[{ itemKey: 'sub', text: 'Sub', items: [{ itemKey: 'leaf', text: 'Leaf' }] }]} renderItemIcon={({ item }) => (item.itemKey === 'leaf' ? <Counted /> : undefined)} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Sub');
    expect(html).not.toContain('leaf icon');
    expect(created).toBe(0);
});

it('items 的条目只放数据', () => {
    // @ts-expect-error an entry's icon comes from renderItemIcon, not from JSX in the data
    const items: NavItems = [{ itemKey: 'a', text: 'A', icon: <b /> }];
    expect(items).toHaveLength(1);
});

it('renderItem* 收到条目与层级，渲染在显示的分支里', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Nav
                defaultOpenKeys={['sub']}
                items={[{ itemKey: 'sub', text: 'Sub', items: [{ itemKey: 'leaf', text: 'Leaf' }] }]}
                renderItemIcon={({ item, level }) => <b>{`icon-${String(item.itemKey)}-${level}`}</b>}
                renderItemText={({ item }) => <em>{`text-${String(item.text)}`}</em>}
                renderItemToggleIcon={({ item }) => <u>{`toggle-${String(item.itemKey)}`}</u>}
                renderItemExpandIcon={({ item }) => <s>{`expand-${String(item.itemKey)}`}</s>}
            />
        ),
    });
    expect(errors).toEqual([]);
    for (const text of ['icon-sub-0', 'icon-leaf-1', 'text-Sub', 'text-Leaf', 'toggle-leaf', 'expand-sub']) {
        expect(html.split(text)).toHaveLength(2);
    }
});

it('折叠时不创建子菜单的 expandIcon', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>expand</b>;
    };
    const { html, errors } = await renderServer({
        render: () => <Nav isCollapsed expandIcon={<Counted />} items={[{ itemKey: 'sub', text: 'Sub', items: ['Leaf'] }]} />,
    });
    expect(errors).toEqual([]);
    expect(html).not.toContain('expand</b>');
    expect(created).toBe(0);
});

it('header、footer 配置只放数据', () => {
    // @ts-expect-error the logo of a header config is a render function
    const logo: NavProps['header'] = { logo: <b /> };
    // @ts-expect-error the text of a header config is a string or number
    const text: NavProps['header'] = { text: <b /> };
    // @ts-expect-error a footer config takes its own collapse button as a render function
    const button: NavProps['footer'] = { collapseButton: <b /> };
    expect([logo, text, button]).toHaveLength(3);
});

it('Nav.Header 的 text 只收文本', () => {
    // @ts-expect-error nodes go in Nav.Header's children, text also names the collapsed link
    const header = <Nav.Header text={<b />} />;
    expect(header).toBeDefined();
});

it('header 配置的 logo 渲染一次', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>logo</b>;
    };
    const { html, errors } = await renderServer({
        render: () => <Nav header={{ logo: () => <Counted />, text: 'Console' }} />,
    });
    expect(errors).toEqual([]);
    expect(html.split('logo</b>')).toHaveLength(2);
    expect(created).toBe(1);
});

it('水平导航不创建 footer 配置的 collapseButton', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>collapse</b>;
    };
    const { html, errors } = await renderServer({
        render: () => <Nav mode="horizontal" footer={{ collapseButton: () => <Counted /> }} />,
    });
    expect(errors).toEqual([]);
    expect(html).not.toContain('collapse</b>');
    expect(created).toBe(0);
});
