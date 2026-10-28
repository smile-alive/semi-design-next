/** @jsxImportSource vue */
import { describe, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Steps, { Step } from '../index';

describe('Steps（浏览器）', () => {
    it.each(['basic', 'fill', 'nav'] as const)('可点击的 %s 步骤显示主题焦点环', async (type) => {
        const { container } = render(() => (
            // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                <Steps type={type} current={1} onChange={() => {}}>
                    {() => ['A', 'B', 'C'].map((title) => <Step>{{ title: () => title, description: () => title.toLowerCase() }}</Step>)}
                </Steps>
            </div>
        ));
        const item = container.querySelector(`.${BASE_CLASS_PREFIX}-steps-item`) as Element;
        await tabTo(item);
        expectThemeFocusRing(item);
    });
});
