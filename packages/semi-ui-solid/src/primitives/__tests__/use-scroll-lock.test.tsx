import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import useScrollLock from '../use-scroll-lock';

describe('useScrollLock', () => {
    it('locked 期间锁住页面滚动，与其它锁共用计数', () => {
        const [firstLocked, setFirstLocked] = createSignal(false);
        render(() => {
            useScrollLock(firstLocked);
            return null;
        });
        expect(document.body.style.overflow).toBe('');
        setFirstLocked(true);
        expect(document.body.style.overflow).toBe('hidden');
        const second = render(() => {
            useScrollLock(() => true);
            return null;
        });
        setFirstLocked(false);
        expect(document.body.style.overflow).toBe('hidden');
        second.unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
