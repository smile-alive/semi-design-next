import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, UserGuide } from '@fibrae/semi-ui-react';

function Tour(props) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button id="tour-a" onClick={() => setVisible(true)}>
                Start
            </Button>
            <Button id="tour-b">Second</Button>
            <UserGuide
                steps={[
                    { target: () => document.querySelector('#tour-a'), title: 'Step A' },
                    { target: () => document.querySelector('#tour-b'), title: 'Step B' },
                ]}
                visible={visible}
                onFinish={() => setVisible(false)}
                onSkip={() => setVisible(false)}
                {...props}
            />
        </>
    );
}

describe('UserGuide 弹出模式焦点', () => {
    it('每一步将焦点交给主按钮，关闭后焦点回到触发元素', async () => {
        render(<Tour />);
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
        function Controlled() {
            const [visible, setVisible] = useState(true);
            return (
                <>
                    <Button onClick={() => setVisible(false)}>Elsewhere</Button>
                    {/* no overlay over the button the test clicks */}
                    <Tour mask={false} visible={visible} />
                </>
            );
        }
        render(<Controlled />);
        await screen.findByRole('dialog', { name: 'Step A' });
        const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
        await userEvent.click(elsewhere);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(elsewhere).toHaveFocus();
    });

    it('焦点在卡片内自定义元素的 ShadowRoot 里时，关闭引导后焦点回到触发元素', async () => {
        const attachInput = (node: HTMLElement | null) => {
            if (node && !node.shadowRoot) {
                node.attachShadow({ mode: 'open' }).innerHTML = '<input aria-label="inner">';
            }
        };
        const steps = [{ target: () => document.querySelector<HTMLElement>('#tour-a'), title: 'Step A', description: <div ref={attachInput} data-testid="inner-host" /> }];
        render(<Tour steps={steps} />);
        const opener = screen.getByRole('button', { name: 'Start' });
        await userEvent.click(opener);
        const inner = (await screen.findByTestId('inner-host')).shadowRoot?.querySelector('input');
        inner?.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('ShadowRoot 内关闭引导后焦点回到触发元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const steps = [{ target: () => mount.querySelector<HTMLElement>('#tour-a'), title: 'Step A' }];
        const view = render(<Tour steps={steps} />, { container: mount });
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
