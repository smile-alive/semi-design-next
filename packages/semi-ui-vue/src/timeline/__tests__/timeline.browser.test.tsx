/** @jsxImportSource vue */
import { describe, it } from 'vite-plus/test';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Timeline, { TimelineItem } from '../index';

describe('Timeline（浏览器）', () => {
    it('可点击的项显示主题焦点环', async () => {
        const { container } = render(() => (
            // the theme is not loaded: define the focus token so the ring color is valid
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                <Timeline>{() => <TimelineItem onClick={() => {}}>{() => 'a'}</TimelineItem>}</Timeline>
            </div>
        ));
        const content = container.querySelector('[role="button"]') as Element;
        await tabTo(content);
        expectThemeFocusRing(content);
    });
});
