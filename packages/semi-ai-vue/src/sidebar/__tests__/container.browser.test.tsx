/** @jsxImportSource vue */
import { defineComponent, ref } from 'vue';
import { waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Sidebar from '..';

const { Container } = Sidebar;

describe('Sidebar.Container', () => {
    it('关闭动画结束后焦点回到打开前聚焦的元素', async () => {
        const Host = defineComponent({
            props: { visible: Boolean },
            setup: (props) => () => (
                <>
                    <button type="button">opener</button>
                    <Container title="Title" visible={props.visible} />
                </>
            ),
        });
        const view = render(Host, { props: { visible: false } });
        const opener = page.getByRole('button', { name: 'opener' }).element() as HTMLElement;
        opener.focus();
        await view.rerender({ visible: true });
        (page.getByRole('button', { name: zh_CN.Sidebar.close }).element() as HTMLElement).focus();
        await view.rerender({ visible: false });
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it('渲染在 shadow root 内时，关闭后焦点回到打开前聚焦的元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const visible = ref(false);
        const Host = defineComponent({
            setup: () => () => (
                <>
                    <button type="button">opener</button>
                    <Container title="Title" visible={visible.value} onCancel={() => (visible.value = false)} />
                </>
            ),
        });
        render(Host, { container: mount });
        const opener = mount.querySelector('button') as HTMLElement;
        opener.focus();
        visible.value = true;
        const close = await waitFor(() => {
            const found = mount.querySelector<HTMLElement>(`[aria-label="${zh_CN.Sidebar.close}"]`);
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        close.focus();
        expect(shadow.activeElement).toBe(close);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement).toBe(opener));
    });
});
