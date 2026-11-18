import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../__tests__/store.svelte';
import ScrollLockFixture from './scroll-lock-fixture.svelte';

describe('useScrollLock', () => {
    it('locked 期间锁住页面滚动，与其它锁共用计数', () => {
        const first = createStore({ locked: false });
        render(ScrollLockFixture, { props: { store: first } });
        flushSync();
        expect(document.body.style.overflow).toBe('');
        first.locked = true;
        flushSync();
        expect(document.body.style.overflow).toBe('hidden');
        const second = render(ScrollLockFixture, { props: { store: createStore({ locked: true }) } });
        flushSync();
        first.locked = false;
        flushSync();
        expect(document.body.style.overflow).toBe('hidden');
        second.unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
