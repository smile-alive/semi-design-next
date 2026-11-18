/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useHotKeys from '../use-hot-keys';

const keyDown = (target: HTMLElement, code: string) => target.dispatchEvent(new KeyboardEvent('keydown', { code, ctrlKey: true, bubbles: true, cancelable: true }));

describe('useHotKeys', () => {
    it('按下组合键时调用回调，可阻止默认行为；卸载后不再响应', async () => {
        const onHotKey = vi.fn<(e: KeyboardEvent) => void>();
        const preventDefault = ref(false);
        const view = render(
            defineComponent({
                setup() {
                    useHotKeys(
                        () => ['Control', 'k'],
                        onHotKey,
                        () => ({ preventDefault: preventDefault.value })
                    );
                    return () => null;
                },
            })
        );
        expect(keyDown(document.body, 'KeyJ')).toBe(true);
        expect(keyDown(document.body, 'KeyK')).toBe(true);
        expect(onHotKey).toHaveBeenCalledTimes(1);
        preventDefault.value = true;
        await nextTick();
        expect(keyDown(document.body, 'KeyK')).toBe(false);
        expect(onHotKey).toHaveBeenCalledTimes(2);
        view.unmount();
        keyDown(document.body, 'KeyK');
        expect(onHotKey).toHaveBeenCalledTimes(2);
    });

    it('getListenerTarget 变化时换监听目标', async () => {
        const onHotKey = vi.fn<(e: KeyboardEvent) => void>();
        const first = document.body.appendChild(document.createElement('div'));
        const second = document.body.appendChild(document.createElement('div'));
        const target = ref(first);
        render(
            defineComponent({
                setup() {
                    useHotKeys(
                        () => ['Control', 'k'],
                        onHotKey,
                        () => ({ getListenerTarget: () => target.value })
                    );
                    return () => null;
                },
            })
        );
        keyDown(first, 'KeyK');
        expect(onHotKey).toHaveBeenCalledTimes(1);
        target.value = second;
        await nextTick();
        keyDown(first, 'KeyK');
        keyDown(second, 'KeyK');
        expect(onHotKey).toHaveBeenCalledTimes(2);
    });

    it('组合不合法时在 setup 中抛错', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() =>
            render(
                defineComponent({
                    setup() {
                        useHotKeys(
                            () => ['Control', 'Shift'],
                            () => {}
                        );
                        return () => null;
                    },
                })
            )
        ).toThrow('one common key');
    });
});
