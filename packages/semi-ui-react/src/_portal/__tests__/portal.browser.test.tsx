import { useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Modal } from '@fibrae/semi-ui-react';

function Stage() {
    const stage = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    return (
        <div ref={stage} style={{ background: 'white' }} data-testid="stage">
            <button onClick={() => void stage.current.requestFullscreen()}>fullscreen</button>
            <button onClick={() => setVisible(true)}>open</button>
            <Modal title="dialog" motion={false} visible={visible} onCancel={() => setVisible(false)}>
                <input aria-label="name" />
            </Modal>
        </div>
    );
}

describe('Portal（浏览器）', () => {
    afterEach(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    });

    it('全屏期间打开的 Modal 渲染在全屏元素内，可见、可聚焦，全屏内容不被设为 inert', async () => {
        render(<Stage />);
        const stage = screen.getByTestId('stage');
        await userEvent.click(screen.getByRole('button', { name: 'fullscreen' }));
        await waitFor(() => expect(document.fullscreenElement).toBe(stage));

        await userEvent.click(screen.getByRole('button', { name: 'open' }));
        const dialog = await screen.findByRole('dialog');
        expect(stage.contains(dialog)).toBe(true);
        expect(stage.inert).toBe(false);
        const { left, top, width, height } = dialog.getBoundingClientRect();
        expect(dialog.contains(document.elementFromPoint(left + width / 2, top + height / 2))).toBe(true);
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });
});
