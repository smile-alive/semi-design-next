import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { default as Button } from '@fibrae/semi-ui-react/button';
import { default as ButtonGroup } from '@fibrae/semi-ui-react/button/button-group';
import { default as SplitButtonGroup } from '@fibrae/semi-ui-react/button/split-button-group';
import { default as Checkbox } from '@fibrae/semi-ui-react/checkbox';
import { default as Divider } from '@fibrae/semi-ui-react/divider';
import { default as IconButton } from '@fibrae/semi-ui-react/icon-button';
import { default as Input } from '@fibrae/semi-ui-react/input';
import { default as Tag } from '@fibrae/semi-ui-react/tag';
import { default as TagGroup } from '@fibrae/semi-ui-react/tag/group';
import { default as SplitTagGroup } from '@fibrae/semi-ui-react/tag/split-tag-group';
import semiGlobal from '../semi-global';

const getClearableWrapper = (container) => container.querySelector('.semi-input-wrapper-clearable');

describe('semiGlobal.config.overrideDefaultProps (#3318)', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Input defaultProps 可被全局配置覆盖（showClear）', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(<Input />);
        expect(getClearableWrapper(container)).not.toBeNull();
    });

    it('未设置全局配置时 Input 行为不变（showClear 默认 false）', () => {
        semiGlobal.config.overrideDefaultProps = {};
        const { container } = render(<Input />);
        expect(getClearableWrapper(container)).toBeNull();
    });

    it('Checkbox defaultProps 可被全局配置覆盖（defaultChecked）', () => {
        semiGlobal.config.overrideDefaultProps = { Checkbox: { defaultChecked: true } };
        render(<Checkbox>test</Checkbox>);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('组件级 props 优先级高于全局配置', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(<Input showClear={false} />);
        expect(getClearableWrapper(container)).toBeNull();
    });

    it('Divider 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Divider: { layout: 'vertical' } };
        const { container, rerender } = render(<Divider />);
        expect(container.querySelector('.semi-divider')).toHaveClass('semi-divider-vertical');
        rerender(<Divider layout="horizontal" />);
        expect(container.querySelector('.semi-divider')).toHaveClass('semi-divider-horizontal');
    });

    it('IconButton 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { iconPosition: 'right' } };
        const { container, rerender } = render(<IconButton icon={<i />}>text</IconButton>);
        expect(container.querySelector('.semi-button-content-left')).not.toBeNull();
        rerender(
            <IconButton iconPosition="left" icon={<i />}>
                text
            </IconButton>
        );
        expect(container.querySelector('.semi-button-content-left')).toBeNull();
    });

    it('ButtonGroup 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { ButtonGroup: { disabled: true } };
        const { rerender } = render(
            <ButtonGroup>
                <Button>a</Button>
            </ButtonGroup>
        );
        expect(screen.getByRole('button', { name: 'a' })).toBeDisabled();
        rerender(
            <ButtonGroup disabled={false}>
                <Button>a</Button>
            </ButtonGroup>
        );
        expect(screen.getByRole('button', { name: 'a' })).toBeEnabled();
    });

    it('SplitButtonGroup 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { SplitButtonGroup: { 'aria-label': 'global' } };
        const { rerender } = render(
            <SplitButtonGroup>
                <Button>a</Button>
            </SplitButtonGroup>
        );
        expect(screen.getByRole('group', { name: 'global' })).toBeInTheDocument();
        rerender(
            <SplitButtonGroup aria-label="own">
                <Button>a</Button>
            </SplitButtonGroup>
        );
        expect(screen.getByRole('group', { name: 'own' })).toBeInTheDocument();
    });

    it('SplitTagGroup 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { SplitTagGroup: { 'aria-label': 'global' } };
        const { rerender } = render(
            <SplitTagGroup>
                <Tag>a</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group', { name: 'global' })).toBeInTheDocument();
        rerender(
            <SplitTagGroup aria-label="own">
                <Tag>a</Tag>
            </SplitTagGroup>
        );
        expect(screen.getByRole('group', { name: 'own' })).toBeInTheDocument();
    });

    it('TagGroup 读取全局默认值，显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { TagGroup: { size: 'large' } };
        const tagList = [{ children: 'a' }];
        const { container, rerender } = render(<TagGroup tagList={tagList} />);
        expect(container.querySelector('.semi-tag-group')).toHaveClass('semi-tag-group-large');
        rerender(<TagGroup size="small" tagList={tagList} />);
        expect(container.querySelector('.semi-tag-group')).toHaveClass('semi-tag-group-small');
    });

    it('支持冻结的全局默认配置对象', () => {
        semiGlobal.config.overrideDefaultProps = { Input: Object.freeze({ showClear: true }) };
        const { container } = render(<Input />);
        expect(getClearableWrapper(container)).not.toBeNull();
    });
});
