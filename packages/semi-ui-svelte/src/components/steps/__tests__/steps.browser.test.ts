import { render } from '@testing-library/svelte';
import { describe, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { getElement } from '@test/utils/dom/common';
import { Steps } from '../index';

describe('Steps（浏览器）', () => {
    it.each(['basic', 'fill', 'nav'] as const)('可点击的 %s 步骤显示主题焦点环', async (type) => {
        // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
        document.documentElement.style.setProperty('--semi-color-primary-light-active', 'rgb(1, 2, 3)');
        const { container } = render(Steps, {
            props: { type, current: 1, onChange: () => {}, dataSource: ['A', 'B', 'C'].map((title) => ({ title, description: title.toLowerCase() })) },
        });
        const item = getElement(`.${BASE_CLASS_PREFIX}-steps-item`, container);
        await tabTo(item);
        expectThemeFocusRing(item);
    });
});
