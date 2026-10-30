import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconEdit } from '@fibrae/semi-icons-react';
import { AutoComplete, Button, ButtonGroup, Cascader, DatePicker, IconButton, InputGroup, InputNumber, Select, Space, TagInput, TimePicker, TreeSelect } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Input from '../index';
import TextArea from '../textarea';

const inputCls = `${BASE_CLASS_PREFIX}-input`;
const buttonCls = `${BASE_CLASS_PREFIX}-button`;

const treeData = [{ label: 'A', value: 'a', key: 'a' }];

describe('InputGroup 向组内控件下发 size、disabled', () => {
    it('嵌套在包装元素里的深层 Input 也接收组的 size、disabled', () => {
        render(
            <InputGroup disabled size="small">
                <div>
                    <Input aria-label="deep" />
                </div>
                <Space>
                    <Input aria-label="spaced" />
                </Space>
            </InputGroup>
        );
        for (const name of ['deep', 'spaced']) {
            const input = screen.getByRole('textbox', { name });
            expect(input).toBeDisabled();
            expect(input).toHaveClass(`${inputCls}-small`);
        }
    });

    it('Button、IconButton 和嵌套 ButtonGroup 里的 Button 接收组的 size、disabled', () => {
        render(
            <InputGroup disabled size="large">
                <div>
                    <Button>plain</Button>
                </div>
                <IconButton aria-label="icon" icon={<IconEdit />} />
                <ButtonGroup>
                    <Button>first</Button>
                    <Button>second</Button>
                </ButtonGroup>
            </InputGroup>
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(4);
        for (const button of buttons) {
            expect(button).toBeDisabled();
            expect(button).toHaveClass(`${buttonCls}-size-large`);
        }
    });

    it('ButtonGroup 自己的 size 优先于组的，组 disabled 时分隔线带 disabled class', () => {
        const { container } = render(
            <InputGroup disabled size="large">
                <ButtonGroup size="small">
                    <Button>first</Button>
                    <Button>second</Button>
                </ButtonGroup>
            </InputGroup>
        );
        for (const button of screen.getAllByRole('button')) {
            expect(button).toHaveClass(`${buttonCls}-size-small`);
            expect(button).toBeDisabled();
        }
        expect(container.querySelector(`.${buttonCls}-group-line`)).toHaveClass(`${buttonCls}-group-line-disabled`);
    });

    it('外层 ButtonGroup 的值优先于 InputGroup，InputGroup 优先于全局默认', () => {
        render(
            <InputGroup size="large">
                <ButtonGroup size="small">
                    <ButtonGroup>
                        <Button>inner</Button>
                    </ButtonGroup>
                </ButtonGroup>
            </InputGroup>
        );
        expect(screen.getByRole('button')).toHaveClass(`${buttonCls}-size-small`);
    });

    it('控件显式传入的 size、disabled 优先于组的，disabled={false} 也算显式值', () => {
        render(
            <InputGroup disabled size="large">
                <Input aria-label="own" disabled={false} size="small" />
                <Input aria-label="inherit" />
                <Input aria-label="undefined" disabled={undefined} size={undefined} />
                <Button disabled={false} size="small">
                    own
                </Button>
            </InputGroup>
        );
        const own = screen.getByRole('textbox', { name: 'own' });
        expect(own).toBeEnabled();
        expect(own).toHaveClass(`${inputCls}-small`);
        expect(own).not.toHaveClass(`${inputCls}-large`);
        for (const name of ['inherit', 'undefined']) {
            const input = screen.getByRole('textbox', { name });
            expect(input).toBeDisabled();
            expect(input).toHaveClass(`${inputCls}-large`);
        }
        expect(screen.getByRole('button')).toBeEnabled();
        expect(screen.getByRole('button')).toHaveClass(`${buttonCls}-size-small`);
    });

    it('组的值优先于全局默认，没有设置的项仍用全局默认', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'large' }, Button: { size: 'small' } };
        try {
            render(
                <>
                    <InputGroup size="small">
                        <Input aria-label="grouped" />
                        <Button>grouped</Button>
                    </InputGroup>
                    <InputGroup disabled>
                        <Input aria-label="unsized" />
                        <Button>unsized</Button>
                    </InputGroup>
                </>
            );
            expect(screen.getByRole('textbox', { name: 'grouped' })).toHaveClass(`${inputCls}-small`);
            expect(screen.getByRole('button', { name: 'grouped' })).toHaveClass(`${buttonCls}-size-small`);
            expect(screen.getByRole('textbox', { name: 'unsized' })).toHaveClass(`${inputCls}-large`);
            expect(screen.getByRole('button', { name: 'unsized' })).toHaveClass(`${buttonCls}-size-small`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('TextArea 读组的 disabled，显式值优先', () => {
        render(
            <InputGroup disabled>
                <TextArea aria-label="inherit" />
                <TextArea aria-label="own" disabled={false} />
            </InputGroup>
        );
        expect(screen.getByRole('textbox', { name: 'inherit' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: 'own' })).toBeEnabled();
    });

    it('InputNumber 读组的 size、disabled', () => {
        render(
            <InputGroup disabled size="small">
                <InputNumber aria-label="n" />
            </InputGroup>
        );
        const input = screen.getByRole('spinbutton', { name: 'n' });
        expect(input).toBeDisabled();
        expect(input.closest(`.${inputCls}-wrapper`)).toHaveClass(`${inputCls}-wrapper-small`);
    });
});

describe('InputGroup 根元素', () => {
    it('未声明属性只落在组的根元素上，不出现在子控件上', () => {
        const { container } = render(
            <InputGroup id="g" data-group="1" aria-describedby="hint" title="grp">
                <Input aria-label="a" />
            </InputGroup>
        );
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('data-group', '1');
        expect(group).toHaveAttribute('id', 'g');
        expect(group).toHaveAttribute('title', 'grp');
        expect(group).toHaveAttribute('aria-describedby', 'hint');
        for (const attr of ['data-group', 'title', 'aria-describedby']) {
            expect(container.querySelectorAll(`[${attr}]`)).toHaveLength(1);
        }
    });

    it('使用方的 role、aria-label 优先于内置值', () => {
        render(
            <InputGroup aria-label="mine" role="radiogroup">
                <Input aria-label="a" />
            </InputGroup>
        );
        expect(screen.getByRole('radiogroup', { name: 'mine' })).toBeInTheDocument();
        expect(screen.queryByRole('group')).toBeNull();
    });

    it('带 label 时使用方的 aria-labelledby、id 落在分组上而不是外层 wrapper', () => {
        const { container } = render(
            <>
                <span id="own-name">Own</span>
                <InputGroup id="mine" data-group="1" aria-labelledby="own-name" label={{ text: 'Score', name: 'score' }}>
                    <Input aria-label="a" />
                </InputGroup>
            </>
        );
        const group = screen.getByRole('group', { name: 'Own' });
        expect(group).toHaveAttribute('id', 'mine');
        expect(group).toHaveAttribute('data-group', '1');
        expect(container.querySelector(`.${inputCls}-group-wrapper`)).not.toHaveAttribute('data-group');
    });
});

describe('复合控件内部自己渲染的控件不读组', () => {
    const inner = <Button>inner</Button>;
    const controls: Record<string, () => React.ReactElement> = {
        Select: () => <Select prefix={inner} />,
        Cascader: () => <Cascader treeData={treeData} prefix={inner} />,
        TreeSelect: () => <TreeSelect treeData={treeData} prefix={inner} />,
        AutoComplete: () => <AutoComplete prefix={inner} />,
        DatePicker: () => <DatePicker prefix={inner} />,
        // TimePicker has no prefix; insetLabel is the slot in front of the input
        TimePicker: () => <TimePicker insetLabel={inner} />,
        TagInput: () => <TagInput prefix={inner} />,
        InputNumber: () => <InputNumber prefix={inner} />,
    };

    it.each(Object.keys(controls))('%s 的前缀槽里的 Button 不吃组的 size、disabled', (name) => {
        render(
            <InputGroup disabled size="large">
                {controls[name]()}
            </InputGroup>
        );
        const button = screen.getByRole('button', { name: 'inner' });
        expect(button).toBeEnabled();
        expect(button).not.toHaveClass(`${buttonCls}-size-large`);
    });

    it('而控件自身仍接收组的 size、disabled', () => {
        render(
            <InputGroup disabled size="large">
                <Select aria-label="select" prefix={<Input aria-label="inner" />} />
            </InputGroup>
        );
        expect(screen.getByRole('combobox', { name: 'select' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('textbox', { name: 'inner' })).toBeEnabled();
    });
});
