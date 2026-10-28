/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { IconEdit } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import semiGlobal from '../../_utils/semi-global';
import { ButtonGroup } from '../../button';
import IconButton, { type IconButtonProps } from '../index';

const iconSlot = { icon: () => <IconEdit /> };

describe('IconButton', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('不声明从不生效的 iconSize、iconStyle、circle、prefixCls', () => {
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconSize');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconStyle');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('circle');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('prefixCls');
    });

    it('渲染单个原生 button，#icon 与默认插槽都转发', () => {
        const view = render(IconButton, {
            attrs: { 'aria-label': 'edit' },
            slots: { ...iconSlot, default: () => 'text' },
        });
        expect(view.container.firstElementChild).toBe(screen.getByRole('button', { name: 'edit' }));
        expect(view.container.querySelectorAll('.semi-icon-edit')).toHaveLength(1);
        expect(screen.getByText('text')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveClass('semi-button-with-icon');
    });

    it('读 IconButton 全局键，自身值与组值优先于全局值', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { type: 'danger', theme: 'solid' } };
        const view = render(IconButton, { attrs: { 'aria-label': 'a' }, slots: iconSlot });
        expect(screen.getByRole('button')).toHaveClass('semi-button-danger', 'semi-button-solid');
        view.unmount();
        render(() => (
            <ButtonGroup type="warning">
                {() => (
                    <IconButton aria-label="a" theme="light">
                        {iconSlot}
                    </IconButton>
                )}
            </ButtonGroup>
        ));
        expect(screen.getByRole('button')).toHaveClass('semi-button-warning', 'semi-button-light');
    });
});
