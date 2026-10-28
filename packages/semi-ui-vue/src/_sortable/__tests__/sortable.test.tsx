/** @jsxImportSource vue */
import { shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import { SortableHandle } from '..';
import ConfigProvider from '../../config-provider';
import List from './fixtures/list.vue';

const itemTexts = () => [...document.querySelectorAll('.semi-sortable-sortable-item [data-index] > span')].map((item) => item.textContent);

describe('Sortable', () => {
    it('SortableHandle 没有所在项时只渲染插槽内容，不渲染按钮', () => {
        render(() => (
            <SortableHandle>
                {{
                    default: () => <span>drag</span>,
                }}
            </SortableHandle>
        ));
        expect(screen.getByText('drag')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('按 items 顺序渲染各项，每项一个带语言包名称与角色描述的原生按钮', () => {
        render(List);
        expect(itemTexts()).toEqual(['a', 'b', 'c']);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(3);
        for (const handle of handles) {
            expect(handle).toHaveAttribute('type', 'button');
            expect(handle).toHaveAttribute('aria-roledescription', zh_CN.Sortable.roleDescription);
            expect(handle).toHaveClass('semi-sortable-sortable-handle');
        }
        expect([...document.querySelectorAll('[data-index]')].map((node) => node.getAttribute('data-index'))).toEqual(['0', '1', '2']);
    });

    it('切换语言后，拖拽手柄的键盘说明随之更新', async () => {
        const locale = shallowRef(zh_CN);
        render(() => <ConfigProvider locale={locale.value}>{() => <List />}</ConfigProvider>);
        const instructions = () => {
            const id = screen.getAllByRole('button')[0].getAttribute('aria-describedby');
            return id ? document.getElementById(id)?.textContent : undefined;
        };
        await waitFor(() => expect(instructions()).toBe(zh_CN.Sortable.instructions));
        locale.value = en_US;
        await waitFor(() => expect(instructions()).toBe(en_US.Sortable.instructions));
    });

    it('items 变化后按 id 复用原有节点', async () => {
        const view = render(List);
        const [handleA] = screen.getAllByRole('button');
        await view.rerender({ items: ['b', 'a', 'c'] });
        expect(itemTexts()).toEqual(['b', 'a', 'c']);
        expect(screen.getAllByRole('button')[1]).toBe(handleA);
    });

    it('列表容器接收 class、role、aria-label、tabindex 与 style', () => {
        render(List);
        const list = screen.getByRole('list', { name: 'list' });
        expect(list).toHaveClass('list');
        expect(list).toHaveAttribute('tabindex', '0');
        expect(list).toHaveStyle({ overflow: 'auto' });
        expect(list.querySelectorAll('.semi-sortable-sortable-item')).toHaveLength(3);
    });

    it('dragOverlayClass 落在浮层元素上，浮层与列表是兄弟，未拖拽时为空', () => {
        render(List);
        const overlay = document.querySelector('[data-dnd-overlay]');
        expect(overlay).toHaveClass('overlay');
        expect(overlay).toBeEmptyDOMElement();
        expect(overlay?.previousElementSibling).toBe(screen.getByRole('list'));
    });
});
