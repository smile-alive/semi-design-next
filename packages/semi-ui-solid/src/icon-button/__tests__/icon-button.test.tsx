import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { IconEdit } from '@fibrae/semi-icons-solid';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import { ButtonGroup } from '../../button';
import IconButton, { type IconButtonProps } from '../index';

describe('IconButton', () => {
    let saved: OverrideDefaultProps | undefined;

    beforeEach(() => {
        saved = semiGlobal.config.overrideDefaultProps;
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = saved;
    });

    it('不声明从不生效的 iconSize、iconStyle、circle、prefixCls', () => {
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconSize');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconStyle');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('circle');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('prefixCls');
    });

    it('渲染单个原生 button，icon 与 children 都渲染，ref 落在原生 button', () => {
        let ref: HTMLButtonElement | undefined;
        const view = render(() => (
            <IconButton aria-label="edit" icon={<IconEdit />} ref={(node) => (ref = node)}>
                text
            </IconButton>
        ));
        const button = screen.getByRole('button', { name: 'edit' });
        expect(view.container.firstElementChild).toBe(button);
        expect(ref).toBe(button);
        expect(view.container.querySelectorAll('.semi-icon-edit')).toHaveLength(1);
        expect(screen.getByText('text')).toBeInTheDocument();
        expect(button).toHaveClass('semi-button-with-icon');
    });

    it('读 IconButton 全局键，自身值与组值优先于全局值', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { type: 'danger', theme: 'solid' } };
        const view = render(() => <IconButton aria-label="a" icon={<IconEdit />} />);
        expect(screen.getByRole('button')).toHaveClass('semi-button-danger', 'semi-button-solid');
        view.unmount();
        render(() => (
            <ButtonGroup type="warning">
                <IconButton aria-label="a" theme="light" icon={<IconEdit />} />
            </ButtonGroup>
        ));
        expect(screen.getByRole('button')).toHaveClass('semi-button-warning', 'semi-button-light');
    });
});
