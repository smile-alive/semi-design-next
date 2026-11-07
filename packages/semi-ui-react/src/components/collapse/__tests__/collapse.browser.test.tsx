import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Collapse } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

describe('Collapse（浏览器）', () => {
    // Chrome makes an overflowing scroll container keyboard focusable; that focus must not show the default ring
    it('可滚动内容获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(
            <Collapse defaultActiveKey="1">
                <Collapse.Panel header="panel" itemKey="1">
                    <div style={{ height: 400 }}>tall content</div>
                </Collapse.Panel>
            </Collapse>
        );
        const content = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-collapse-content`);
        content.style.cssText = 'max-height: 40px; overflow: auto';
        await tabTo(content);
        expectThemeFocusRing(content);
    });

    // the button covers only the title; the ring outlines the whole header row, the area the pointer toggles
    it('按钮获得键盘焦点时，标题行显示主题焦点环', async () => {
        const { getByRole } = render(
            <Collapse>
                <Collapse.Panel header="panel" itemKey="1">
                    content
                </Collapse.Panel>
            </Collapse>
        );
        const button = getByRole('button', { name: 'panel' });
        await tabTo(button);
        expectThemeFocusRing(button.closest(`.${BASE_CLASS_PREFIX}-collapse-header`));
        expect(getComputedStyle(button).outlineStyle).toBe('none');
    });
});
