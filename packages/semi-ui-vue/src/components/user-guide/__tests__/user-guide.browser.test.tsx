/** @jsxImportSource vue */
import { defineComponent, ref } from 'vue';
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Button from '../../button';
import UserGuide from '../user-guide.vue';
import Tour from './fixtures/tour.vue';

// Focus, Tab and anchor positioning need a real browser; the jsdom suite only sees the attributes
describe('UserGuide 弹出模式焦点（浏览器）', () => {
    it('每一步将焦点交给主按钮，关闭后焦点回到触发元素', async () => {
        render(Tour);
        const opener = screen.getByRole('button', { name: 'Start' });
        await userEvent.click(opener);
        const first = await screen.findByRole('dialog', { name: 'Step A' });
        const next = screen.getByRole('button', { name: zh_CN.UserGuide.next });
        expect(first).toContainElement(next);
        await waitFor(() => expect(next).toHaveFocus());

        await userEvent.keyboard('{Tab}');
        expect(first).toContainElement(document.activeElement as HTMLElement);

        next.focus();
        await userEvent.keyboard('{Enter}');
        const second = await screen.findByRole('dialog', { name: 'Step B' });
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.UserGuide.finish })).toHaveFocus());
        expect(second).toContainElement(document.activeElement as HTMLElement);

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('用户把焦点移出卡片后，引导关闭时焦点保持在那里', async () => {
        render(Tour, { props: { mask: false, startVisible: true } });
        await screen.findByRole('dialog', { name: 'Step A' });
        const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
        await userEvent.click(elsewhere);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(elsewhere).toHaveFocus();
    });

    it('锚点不在 Tab 顺序里，Tab 在卡片内循环', async () => {
        render(Tour);
        await userEvent.click(screen.getByRole('button', { name: 'Start' }));
        const card = await screen.findByRole('dialog', { name: 'Step A' });
        const anchor = document.querySelector<HTMLElement>('[tabindex="-1"][style*="position: fixed"]');
        expect(anchor).not.toBeNull();
        await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));
        for (let i = 0; i < 8; i += 1) {
            await userEvent.keyboard('{Tab}');
            expect(document.activeElement).not.toBe(anchor);
            expect(card.contains(document.activeElement)).toBe(true);
        }
    });

    it('卡片贴近目标：锚点的 px 位置被浏览器吃到', async () => {
        render(Tour);
        const target = screen.getByRole('button', { name: 'Start' });
        await userEvent.click(target);
        const card = await screen.findByRole('dialog', { name: 'Step A' });
        const wrapper = card.closest<HTMLElement>('[popover]') ?? card;
        await waitFor(() => {
            const cardRect = wrapper.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            expect(cardRect.width).toBeGreaterThan(0);
            // a missing px unit would drop the anchor to the viewport origin, far from the target
            expect(Math.abs(cardRect.top - targetRect.bottom)).toBeLessThan(80);
        });
    });
});

describe('UserGuide 弹出模式 ShadowRoot（浏览器）', () => {
    it('焦点在卡片内自定义元素的 ShadowRoot 里时，关闭引导后焦点回到触发元素', async () => {
        const attachInput = (node: unknown) => {
            if (node instanceof HTMLElement && !node.shadowRoot) {
                node.attachShadow({ mode: 'open' }).innerHTML = '<input aria-label="inner">';
            }
        };
        const steps = [{ target: () => document.querySelector<HTMLElement>('#tour-a'), title: 'Step A' }];
        const Demo = defineComponent(() => {
            const visible = ref(false);
            return () => (
                <>
                    <Button id="tour-a" onClick={() => (visible.value = true)}>
                        {() => 'Start'}
                    </Button>
                    <UserGuide steps={steps} visible={visible.value} onUpdate:visible={(value: boolean) => (visible.value = value)}>
                        {{
                            description: () => [<div ref={attachInput} data-testid="inner-host" />],
                        }}
                    </UserGuide>
                </>
            );
        });
        render(Demo);
        const opener = screen.getByRole('button', { name: 'Start' });
        await userEvent.click(opener);
        const inner = (await screen.findByTestId('inner-host')).shadowRoot?.querySelector('input');
        inner?.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('关闭引导后焦点回到触发元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const steps = [{ target: () => mount.querySelector<HTMLElement>('#tour-a'), title: 'Step A' }];
        const Demo = defineComponent(() => {
            const visible = ref(false);
            return () => (
                <>
                    <Button id="tour-a" onClick={() => (visible.value = true)}>
                        {() => 'Start'}
                    </Button>
                    <UserGuide steps={steps} visible={visible.value} onUpdate:visible={(value: boolean) => (visible.value = value)} />
                </>
            );
        });
        const view = render(Demo, { container: mount });
        try {
            // the popup mounts in the shadow root itself, beside the render container
            const page = within(shadow as unknown as HTMLElement);
            const opener = page.getByRole('button', { name: 'Start' });
            await userEvent.click(opener);
            await page.findByRole('dialog');
            await waitFor(() => expect(shadow.activeElement).toBe(page.getByRole('button', { name: zh_CN.UserGuide.finish })));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
            expect(shadow.activeElement).toBe(opener);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});

describe('UserGuide 弹窗模式焦点（浏览器）', () => {
    it('初次聚焦主按钮而不是跳过', async () => {
        render(Tour, { props: { mode: 'modal' } });
        await userEvent.click(screen.getByRole('button', { name: 'Start' }));
        const dialog = await screen.findByRole('dialog', { name: 'Step A' });
        const next = screen.getByRole('button', { name: zh_CN.UserGuide.next });
        expect(dialog).toContainElement(next);
        await waitFor(() => expect(next).toHaveFocus());
    });
});
