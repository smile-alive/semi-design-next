/** @jsxImportSource vue */
import { KeepAlive, defineComponent } from 'vue';
import { fireEvent, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { countLiveListeners, render } from '@test/utils/vue';
import Anchor, { AnchorLink } from '../index';

const Host = defineComponent({
    props: { active: { type: Boolean, required: true } },
    setup: (props) => () => <KeepAlive>{props.active ? <Anchor>{() => <AnchorLink href="#docs" title="docs" />}</Anchor> : <p>other</p>}</KeepAlive>,
});

describe('Anchor KeepAlive', () => {
    it('失活后释放窗口上的 scroll 监听，激活后恢复', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const live = () => countLiveListeners(add, remove, 'scroll');
        const view = render(Host, { props: { active: true } });
        // one throttled listener for the active link and one debounced listener for the end of a click scroll
        expect(live()).toBe(2);

        await view.rerender({ active: false });
        expect(live()).toBe(0);

        await view.rerender({ active: true });
        expect(live()).toBe(2);
    });

    it('重新激活后滚动仍能更新激活链接', async () => {
        const target = document.createElement('h2');
        target.id = 'docs';
        // jsdom does not lay out: the target is scrolled past the container top, so scrolling makes its link active
        target.getBoundingClientRect = () => ({ top: -10 }) as DOMRect;
        document.body.append(target);
        const view = render(Host, { props: { active: true } });
        const link = () => view.getByRole('link', { name: 'docs' });

        await view.rerender({ active: false });
        await fireEvent.scroll(window);
        await view.rerender({ active: true });
        expect(link()).not.toHaveAttribute('aria-current');

        await fireEvent.scroll(window);
        await waitFor(() => expect(link()).toHaveAttribute('aria-current', 'location'));
        target.remove();
    });
});
