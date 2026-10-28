/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Collapse, { CollapsePanel } from '..';

describe('Collapse（浏览器）', () => {
    // Chrome makes an overflowing scroll container keyboard focusable; that focus must not show the default ring
    it('可滚动内容获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(() => (
            <Collapse defaultActiveKey="1">
                {() => (
                    <CollapsePanel itemKey="1">
                        {{
                            header: () => 'panel',
                            default: () => <div style={{ height: '400px' }}>tall content</div>,
                        }}
                    </CollapsePanel>
                )}
            </Collapse>
        ));
        const content = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-collapse-content`) as HTMLElement;
        // consumers such as Sidebar cap the height and let the content scroll
        content.style.cssText = 'max-height: 40px; overflow: auto';
        await tabTo(content);
        expectThemeFocusRing(content);
    });

    // the button covers only the title; the ring outlines the whole header row, the area the pointer toggles
    it('按钮获得键盘焦点时，标题行显示主题焦点环', async () => {
        const view = render(() => <Collapse>{() => <CollapsePanel itemKey="1">{{ header: () => 'panel', default: () => 'content' }}</CollapsePanel>}</Collapse>);
        const button = view.getByRole('button', { name: 'panel' });
        await tabTo(button);
        expectThemeFocusRing(button.closest(`.${BASE_CLASS_PREFIX}-collapse-header`) as HTMLElement);
        expect(getComputedStyle(button).outlineStyle).toBe('none');
    });
});
