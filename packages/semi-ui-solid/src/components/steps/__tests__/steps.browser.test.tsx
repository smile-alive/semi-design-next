import { render } from '@solidjs/testing-library';
import { describe, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Steps from '..';

describe('Steps（浏览器）', () => {
    it.each(['basic', 'fill', 'nav'] as const)('可点击的 %s 步骤显示主题焦点环', async (type) => {
        const { container } = render(() => (
            // no theme loaded: give the focus token a value so the ring color is valid
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                <Steps type={type} current={1} onChange={() => {}}>
                    <Steps.Step title="A" description="a" />
                    <Steps.Step title="B" description="b" />
                    <Steps.Step title="C" description="c" />
                </Steps>
            </div>
        ));
        const item = container.querySelector(`.${BASE_CLASS_PREFIX}-steps-item`) as HTMLElement;
        await tabTo(item);
        expectThemeFocusRing(item);
    });
});
