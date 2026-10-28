import { h, nextTick, ref } from 'vue';
import { motion } from 'motion-v';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { easings, springs } from '../../index';
import '../../src/styles/viewTransition.scss';

describe('Vue 中的 semi-animation 预设', () => {
    it('motion-v 使用 Bézier 预设运行真实动画并到达终态', async () => {
        const completed = Promise.withResolvers<void>();
        const view = render({
            setup: () => () =>
                h(motion.div, {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { duration: 1, ease: easings.easeInOutCubic },
                    onAnimationComplete: () => completed.resolve(),
                }),
        });
        const element = view.container.firstElementChild as HTMLElement;
        await expect.poll(() => element.getAnimations().length).toBeGreaterThan(0);
        await completed.promise;
        expect(getComputedStyle(element).opacity).toBe('1');
    });

    it('motion-v 直接使用 spring 预设并稳定到目标值', async () => {
        const completed = Promise.withResolvers<void>();
        const view = render({
            setup: () => () =>
                h(motion.div, {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: springs.gentle,
                    onAnimationComplete: () => completed.resolve(),
                }),
        });
        const element = view.container.firstElementChild as HTMLElement;
        await expect.poll(() => Number(getComputedStyle(element).opacity)).toBeGreaterThan(0);
        await completed.promise;
        expect(getComputedStyle(element).opacity).toBe('1');
    });

    it('响应式更新在 nextTick 后进入 View Transition，并保留预设 class 动画', async () => {
        const visible = ref(false);
        const view = render({
            setup: () => () =>
                visible.value
                    ? h(
                          'div',
                          {
                              class: 'semi-fade',
                              style: {
                                  width: '100px',
                                  height: '100px',
                                  background: 'var(--semi-color-primary, #1677ff)',
                                  viewTransitionName: 'vue-panel',
                                  viewTransitionClass: 'semi-fade',
                              },
                          },
                          'Vue 内容'
                      )
                    : null,
        });
        const enter = document.startViewTransition(async () => {
            visible.value = true;
            await nextTick();
        });
        await enter.ready;
        expect(view.container.querySelector('.semi-fade')?.textContent).toBe('Vue 内容');
        expect(document.documentElement.getAnimations({ subtree: true }).map((animation) => (animation as CSSAnimation).animationName)).toContain('semi-view-transition-fade-in');
        await enter.finished;
        const leave = document.startViewTransition(async () => {
            visible.value = false;
            await nextTick();
        });
        await leave.ready;
        expect(document.documentElement.getAnimations({ subtree: true }).map((animation) => (animation as CSSAnimation).animationName)).toContain('semi-view-transition-fade-out');
        await leave.finished;
        expect(view.container.querySelector('.semi-fade')).toBeNull();
    });
});
