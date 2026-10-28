import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { type OnSortEnd, Sortable } from '..';
import ConfigProvider from '../../config-provider';

function List(props: { items?: (string | number)[] }) {
    return (
        <Sortable
            dragHandleLabel={zh_CN.Transfer.dragSort}
            items={props.items ?? ['a', 'b', 'c']}
            renderItem={(item) => {
                const Handle = item.sortableHandle(() => <span>drag</span>);
                return (
                    <div>
                        <Handle />
                        <span class="text">{item.id}</span>
                    </div>
                );
            }}
            onSortEnd={vi.fn<OnSortEnd>()}
        />
    );
}

const itemTexts = () => [...document.querySelectorAll('.semi-sortable-sortable-item .text')].map((item) => item.textContent);

describe('Sortable', () => {
    it('按 items 顺序渲染各项，每项一个带语言包名称与角色描述的原生按钮', () => {
        render(() => <List />);
        expect(itemTexts()).toEqual(['a', 'b', 'c']);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(3);
        for (const handle of handles) {
            expect(handle).toHaveAttribute('type', 'button');
            expect(handle).toHaveAttribute('aria-roledescription', zh_CN.Sortable.roleDescription);
            expect(handle).toHaveClass('semi-sortable-sortable-handle');
        }
    });

    it('切换语言后，拖拽手柄的角色描述与键盘说明随之更新', async () => {
        const [locale, setLocale] = createSignal(zh_CN);
        render(() => (
            <ConfigProvider locale={locale()}>
                <List />
            </ConfigProvider>
        ));
        const instructions = () => {
            const id = screen.getAllByRole('button')[0].getAttribute('aria-describedby');
            return id ? document.getElementById(id)?.textContent : undefined;
        };
        await waitFor(() => expect(instructions()).toBe(zh_CN.Sortable.instructions));
        setLocale(en_US);
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-roledescription', en_US.Sortable.roleDescription);
        await waitFor(() => expect(instructions()).toBe(en_US.Sortable.instructions));
    });

    it('items 变化后按 id 复用原有节点', () => {
        const [items, setItems] = createSignal(['a', 'b', 'c']);
        render(() => <List items={items()} />);
        const [handleA] = screen.getAllByRole('button');
        setItems(['b', 'a', 'c']);
        expect(itemTexts()).toEqual(['b', 'a', 'c']);
        expect(screen.getAllByRole('button')[1]).toBe(handleA);
    });

    it('container 包裹列表，prefix 决定项与手柄的 class', () => {
        render(() => (
            <Sortable
                container={(props) => <section aria-label="list">{props.children}</section>}
                dragHandleLabel="drag"
                items={['a']}
                prefix="custom"
                renderItem={(item) => {
                    const Handle = item.sortableHandle(() => <span>drag</span>);
                    return <Handle />;
                }}
                onSortEnd={vi.fn<OnSortEnd>()}
            />
        ));
        const list = screen.getByRole('region', { name: 'list' });
        expect(list.querySelector('.custom-sortable-item')).toContainElement(screen.getByRole('button', { name: 'drag' }));
        expect(screen.getByRole('button', { name: 'drag' })).toHaveClass('custom-sortable-handle');
    });
});
