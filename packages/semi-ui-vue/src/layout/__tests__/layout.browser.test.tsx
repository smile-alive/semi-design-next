/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Layout from '../index';
import DeepSider from './fixtures/deep-sider.vue';

const flexDirection = (container: Element) => getComputedStyle(container.querySelector('.semi-layout') as HTMLElement).flexDirection;

describe('Layout 浏览器', () => {
    it('has-sider 使 Layout 横向排列，无 Sider 时纵向排列', () => {
        const withSider = render(Layout, {
            slots: {
                default: () => (
                    <>
                        <Layout.Sider />
                        <Layout.Content />
                    </>
                ),
            },
        });
        expect(flexDirection(withSider.container)).toBe('row');
        const without = render(Layout, { slots: { default: () => <Layout.Content /> } });
        expect(flexDirection(without.container)).toBe('column');
    });

    it('嵌套较深的 Sider 在 onMounted 登记，has-sider 在下一次 flush 生效，随后横向排列', async () => {
        const view = render(DeepSider, { props: { show: true } });
        await nextTick();
        expect(flexDirection(view.container)).toBe('row');
        await view.rerender({ show: false });
        expect(flexDirection(view.container)).toBe('column');
    });
});
