import type { ComponentProps, CSSProperties } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ColorPicker } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;

describe('ColorPicker（浏览器）', () => {
    it('拖动色相时，指针移出滑块后仍持续跟随，松开后结束', async () => {
        const onChange = vi.fn<NonNullable<ComponentProps<typeof ColorPicker>['onChange']>>();
        const { container } = render(
            <div style={{ display: 'flex', alignItems: 'end' }}>
                <ColorPicker defaultValue={ColorPicker.colorStringToValue('#ff0000')} onChange={onChange} />
                <div style={{ width: 100, height: 100 }} data-testid="outside" />
            </div>
        );
        const slider = container.querySelector(`.${prefixCls}-colorSlider`);
        const handle = slider.querySelector(`.${prefixCls}-handle`);
        const outside = container.querySelector('[data-testid="outside"]');
        expect(getComputedStyle(slider).touchAction).toBe('none');

        await userEvent.dragAndDrop(handle, outside);
        expect(onChange.mock.lastCall[0].hsva.h).toBe(360);

        const changes = onChange.mock.calls.length;
        await userEvent.hover(slider, { position: { x: 10, y: 5 } });
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it('每个拖拽区域都阻止触摸拖动滚动页面', () => {
        const { container } = render(<ColorPicker defaultValue={ColorPicker.colorStringToValue('#ff0000')} alpha />);
        for (const name of ['colorChooseArea', 'colorSlider', 'alphaSlider']) {
            expect(getComputedStyle(container.querySelector(`.${prefixCls}-${name}`)).touchAction).toBe('none');
        }
    });

    it('默认触发器显示主题焦点环', async () => {
        // the theme is not loaded: define the focus token so the ring color is valid
        const { container } = render(
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' } as CSSProperties}>
                <ColorPicker defaultValue={ColorPicker.colorStringToValue('#3370ff')} usePopover />
            </div>
        );
        const trigger = container.querySelector(`.${BASE_CLASS_PREFIX}-colorPicker-popover-defaultChildren`);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });
});
