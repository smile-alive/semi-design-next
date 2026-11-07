import type { CSSProperties } from 'react';
import { render } from '@testing-library/react';
import { describe, it } from 'vite-plus/test';
import { Timeline } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

describe('Timeline（浏览器）', () => {
    it('可点击的项显示主题焦点环', async () => {
        const { container } = render(
            // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' } as CSSProperties}>
                <Timeline>
                    <Timeline.Item onClick={() => {}}>a</Timeline.Item>
                </Timeline>
            </div>
        );
        const content = container.querySelector('[role="button"]');
        await tabTo(content);
        expectThemeFocusRing(content);
    });
});
