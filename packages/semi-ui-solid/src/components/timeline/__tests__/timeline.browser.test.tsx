import { render } from '@solidjs/testing-library';
import { describe, it } from 'vite-plus/test';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Timeline from '..';

describe('Timeline（浏览器）', () => {
    it('可点击的项显示主题焦点环', async () => {
        const { container } = render(() => (
            // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                <Timeline>
                    <Timeline.Item onClick={() => {}}>a</Timeline.Item>
                </Timeline>
            </div>
        ));
        const content = container.querySelector('[role="button"]') as HTMLElement;
        await tabTo(content);
        expectThemeFocusRing(content);
    });
});
