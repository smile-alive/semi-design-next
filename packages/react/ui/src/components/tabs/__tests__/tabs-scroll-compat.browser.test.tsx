import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { TabPane, Tabs } from '@fibrae/semi-ui-react';
import { sleep } from '@test/utils/react';

// Firefox and Safari ignore scrollIntoView({ container }): drop it here so the probe fails as it does there, and a page
// scroll caused by the fallback would show up as a changed scrollY.
const nativeScrollIntoView = Reflect.get(Element.prototype, 'scrollIntoView') as Element['scrollIntoView'];
vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element, options) {
    const { container: _container, ...rest } = (options ?? {}) as ScrollIntoViewOptions & { container?: string };
    Reflect.apply(nativeScrollIntoView, this, [rest]);
});

describe('Tabs 在不支持 scrollIntoView container 的浏览器中', () => {
    it('折叠模式滚动选中页签时只滚动页签栏，不滚动页面', async () => {
        const keys = [...Array(10).keys()];
        const renderControlled = (activeKey: string) => (
            <>
                <div style={{ height: 3000 }} />
                <Tabs type="card" style={{ width: 500 }} activeKey={activeKey} collapsible>
                    {keys.map((i) => (
                        <TabPane key={i} itemKey={`tab-${i}`} tab={`Tab-${i}`}>
                            content of tab {i}
                        </TabPane>
                    ))}
                </Tabs>
            </>
        );
        window.scrollTo(0, 0);
        const { container, rerender } = render(renderControlled('tab-0'));
        const wrapper = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`) as HTMLElement;
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await sleep(300);
        const before = wrapper.scrollLeft;

        rerender(renderControlled('tab-7'));
        await waitFor(() => expect(wrapper.scrollLeft).not.toBe(before));
        await waitFor(() => expect(tab7.getBoundingClientRect().right).toBeLessThanOrEqual(wrapper.getBoundingClientRect().right + 1));
        expect(window.scrollY).toBe(0);
    });
});
