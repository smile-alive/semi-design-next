import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '../../_utils/semi-global';
import IconButton from '../../icon-button';
import Modal from '../../modal';
import Popover from '../../popover';
import Tooltip from '../../tooltip';
import ButtonGroup from '../button-group';
import Button from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;

describe('ButtonGroup 的子项', () => {
    it('Fragment 内的按钮之间有分隔线并拿到组的 size', () => {
        const { container } = render(
            <ButtonGroup size="small">
                <>
                    <Button>a</Button>
                    <Button>b</Button>
                </>
            </ButtonGroup>
        );
        expect(container.querySelectorAll(`.${prefixCls}-group-line`)).toHaveLength(1);
        screen.getAllByRole('button').forEach((button) => expect(button).toHaveClass(`${prefixCls}-size-small`));
    });

    it('被 Tooltip 包住的按钮拿到组的 disabled，Tooltip 仍能点击触发', async () => {
        const { container } = render(
            <ButtonGroup disabled>
                <Tooltip wrapperClassName="wrap" content="tip" motion={false} trigger="click">
                    <Button>a</Button>
                </Tooltip>
                <IconButton aria-label="b" icon={<i />} />
            </ButtonGroup>
        );
        screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
        const wrapper = container.querySelector('.wrap');
        expect(wrapper).not.toBeNull();
        fireEvent.click(wrapper);
        await waitFor(() => expect(screen.getByText('tip')).toBeInTheDocument());
    });

    it('被 Popover 包住的按钮拿到组的 type、theme，弹层内的按钮不继承', async () => {
        render(
            <ButtonGroup type="danger" theme="solid">
                <Popover content={<Button>inner</Button>} motion={false} trigger="click">
                    <Button>outer</Button>
                </Popover>
            </ButtonGroup>
        );
        const outer = screen.getByRole('button', { name: 'outer' });
        expect(outer).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`);
        fireEvent.click(outer);
        const inner = await screen.findByRole('button', { name: 'inner' });
        expect(inner).not.toHaveClass(`${prefixCls}-danger`);
        expect(inner).not.toHaveClass(`${prefixCls}-solid`);
    });

    it('组内声明的 Modal，对话框里的按钮不继承组值', () => {
        function ConfirmButton() {
            return (
                <>
                    <Button>open</Button>
                    <Modal title="confirm" motion={false} visible>
                        body
                    </Modal>
                </>
            );
        }
        render(
            <ButtonGroup disabled size="large">
                <ConfirmButton />
            </ButtonGroup>
        );
        expect(screen.getByRole('button', { name: 'open' })).toBeDisabled();
        within(screen.getByRole('dialog'))
            .getAllByRole('button')
            .forEach((button) => {
                expect(button).toBeEnabled();
                expect(button).not.toHaveClass(`${prefixCls}-size-large`);
            });
    });

    it('嵌套的 ButtonGroup 中没有设置的组值继承外层组', () => {
        render(
            <ButtonGroup size="small">
                <ButtonGroup type="danger">
                    <Button>a</Button>
                </ButtonGroup>
            </ButtonGroup>
        );
        expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-danger`);
    });

    it('组值优先于全局 overrideDefaultProps，分隔线与按钮一致', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { size: 'large', theme: 'borderless' }, IconButton: { size: 'large', theme: 'borderless' } };
        try {
            const { container } = render(
                <ButtonGroup size="small" theme="solid">
                    <Button>a</Button>
                    <IconButton aria-label="b" icon={<i />} />
                </ButtonGroup>
            );
            screen.getAllByRole('button').forEach((button) => expect(button).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-solid`));
            expect(container.querySelector(`.${prefixCls}-group-line`)).toHaveClass(`${prefixCls}-group-line-solid`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
