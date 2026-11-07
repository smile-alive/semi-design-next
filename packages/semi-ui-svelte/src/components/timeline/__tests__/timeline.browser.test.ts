import { render } from '@testing-library/svelte';
import { describe, it } from 'vite-plus/test';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { Timeline } from '../index';

describe('Timeline（浏览器）', () => {
    it('可点击的项显示主题焦点环', async () => {
        // the theme is not loaded: define the focus token so the ring color is valid
        document.documentElement.style.setProperty('--semi-color-primary-light-active', 'rgb(1, 2, 3)');
        const { container } = render(Timeline, { props: { dataSource: [{ content: 'a', onClick: () => {} }] } });
        const content = container.querySelector('[role="button"]') as Element;
        await tabTo(content);
        expectThemeFocusRing(content);
    });
});
