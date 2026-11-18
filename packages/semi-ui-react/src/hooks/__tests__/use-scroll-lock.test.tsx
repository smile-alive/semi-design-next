import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import useScrollLock from '../use-scroll-lock';

function Probe({ locked }: { locked: boolean }) {
    useScrollLock(locked);
    return null;
}

describe('useScrollLock', () => {
    it('locked 期间锁住页面滚动，与其它锁共用计数', () => {
        const first = render(<Probe locked={false} />);
        expect(document.body.style.overflow).toBe('');
        first.rerender(<Probe locked />);
        expect(document.body.style.overflow).toBe('hidden');
        const second = render(<Probe locked />);
        first.rerender(<Probe locked={false} />);
        expect(document.body.style.overflow).toBe('hidden');
        second.unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
