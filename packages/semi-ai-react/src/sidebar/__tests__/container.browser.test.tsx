import { useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Sidebar } from '@fibrae/semi-ai-react';

const { Container } = Sidebar;

describe('Sidebar.Container', () => {
    it('渲染在 shadow root 内时，关闭后焦点回到打开前聚焦的元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const Host = () => {
            const [visible, setVisible] = useState(false);
            return (
                <>
                    <button type="button" onClick={() => setVisible(true)}>
                        opener
                    </button>
                    <Container title="Title" visible={visible} onCancel={() => setVisible(false)} />
                </>
            );
        };
        render(<Host />, { container: mount });
        const opener = mount.querySelector('button') as HTMLElement;
        opener.focus();
        await userEvent.keyboard('{Enter}');
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
