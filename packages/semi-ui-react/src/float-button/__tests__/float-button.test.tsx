import { createElement, createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { FloatButton, FloatButtonGroup } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { FloatButtonGroupProps } from '../float-button-group';
import type { FloatButtonProps } from '../interface';

type ClickHandler = (e: React.MouseEvent) => void;
type GroupClickHandler = (value: string, e: React.MouseEvent) => void;

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

const items = [
    { icon: <i data-testid="icon-editor" />, content: 'Editor', value: 'editor' },
    { icon: <i data-testid="icon-search" />, content: 'Search', value: 'search', badge: { count: 5 } },
];

describe('FloatButton', () => {
    it('默认在根元素与 body 上渲染 round 与 default 尺寸类名', () => {
        const { container } = render(<FloatButton icon={<i data-testid="icon" />} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-round`, `${prefixCls}-default`);
        const body = root.querySelector(`.${prefixCls}-body`);
        expect(body).toHaveClass(`${prefixCls}-round`, `${prefixCls}-default`);
        expect(body).not.toHaveClass(`${prefixCls}-colorful`);
        expect(body).not.toHaveClass(`${prefixCls}-disabled`);
        expect(body.querySelector('[data-testid="icon"]')).not.toBeNull();
    });

    it('应用 shape、size、colorful 与 disabled 类名', () => {
        const { container } = render(<FloatButton disabled colorful shape="square" size="large" />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`);
        expect(root).not.toHaveClass(`${prefixCls}-round`);
        const body = root.querySelector(`.${prefixCls}-body`);
        expect(body).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, `${prefixCls}-disabled`);
    });

    it('className 与 style 作用于根元素', () => {
        const { container } = render(<FloatButton className="custom" style={{ bottom: 20 }} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ bottom: '20px' });
    });

    it('设置 badge 时用 Badge 包裹 body', () => {
        const { container } = render(
            <div>
                <FloatButton badge={{ count: 1000, overflowCount: 999 }} />
                <FloatButton badge={{ dot: true, type: 'danger' }} />
                <FloatButton />
            </div>
        );
        const [count, dot, plain] = container.querySelectorAll(`.${prefixCls}`);
        const countBadge = count.querySelector('.semi-badge');
        expect(countBadge.querySelector(`.${prefixCls}-body`)).not.toBeNull();
        expect(countBadge.querySelector('.semi-badge-count')).toHaveTextContent('999+');
        expect(dot.querySelector('.semi-badge-dot')).toHaveClass('semi-badge-danger');
        expect(plain.querySelector('.semi-badge')).toBeNull();
        expect(plain.firstElementChild).toHaveClass(`${prefixCls}-body`);
    });

    it('调用 onClick 并传入事件', () => {
        const onClick = vi.fn<ClickHandler>();
        const { container } = render(<FloatButton onClick={onClick} />);
        fireEvent.click(container.querySelector(`.${prefixCls}-body`));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('无 href 时渲染 type 为 button 的原生按钮', () => {
        const { getByRole } = render(<FloatButton aria-label="Edit" icon={<i />} />);
        const root = getByRole('button', { name: 'Edit' });
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toBeDisabled();
        expect(root).not.toHaveAttribute('aria-disabled');
        expect(root.querySelector(`.${prefixCls}-body`).tagName).toBe('SPAN');
    });

    it('渲染带 href、target 与 rel 的原生链接', () => {
        const { getByRole } = render(<FloatButton aria-label="Semi" href="https://semi.design" rel="noreferrer" target="_blank" />);
        const link = getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://semi.design');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
        expect(link).not.toHaveAttribute('type');
    });

    it('链接上调用 onClick，且不阻止原生跳转', () => {
        const onClick = vi.fn<ClickHandler>();
        const { getByRole } = render(<FloatButton aria-label="Anchor" href="#float-button" onClick={onClick} />);
        let prevented;
        // Runs after React's root listener; it also stops jsdom from navigating
        const listener = (e) => {
            prevented = e.defaultPrevented;
            e.preventDefault();
        };
        document.addEventListener('click', listener);
        try {
            fireEvent.click(getByRole('link', { name: 'Anchor' }));
        } finally {
            document.removeEventListener('click', listener);
        }
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(prevented).toBe(false);
    });

    it('原生禁用按钮，并跳过 onClick', () => {
        const onClick = vi.fn<ClickHandler>();
        const { getByRole } = render(<FloatButton aria-label="Edit" disabled onClick={onClick} />);
        const root = getByRole('button', { name: 'Edit' });
        expect(root).toBeDisabled();
        expect(root).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(root.querySelector(`.${prefixCls}-body`));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('禁用链接变为不可跳转的链接，带 aria-disabled，并跳过 onClick', () => {
        const onClick = vi.fn<ClickHandler>();
        const { getByRole } = render(<FloatButton aria-label="Semi" disabled href="https://semi.design" target="_blank" onClick={onClick} />);
        const link = getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).not.toHaveAttribute('href');
        expect(link).not.toHaveAttribute('target');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).not.toHaveAttribute('tabindex');
        fireEvent.click(link);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('data-* 与 id 等未知属性透传到根元素', () => {
        const { container } = render(<FloatButton id="fb-id" data-testid="fb" aria-label="Edit" />);
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('data-testid', 'fb');
        expect(root).toHaveAttribute('id', 'fb-id');
        expect(root).toHaveAttribute('aria-label', 'Edit');
        expect(root).not.toHaveAttribute('href');
        expect(root).not.toHaveAttribute('target');
    });

    it('ref 挂载到根按钮或链接', () => {
        const buttonRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
        const linkRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
        const { container } = render(
            <div>
                <FloatButton ref={buttonRef} />
                <FloatButton ref={linkRef} href="#top" />
            </div>
        );
        const [button, link] = container.querySelectorAll(`.${prefixCls}`);
        expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
        expect(buttonRef.current).toBe(button);
        expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
        expect(linkRef.current).toBe(link);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { FloatButton: { shape: 'square', size: 'small' } };
        try {
            const { container } = render(
                <div>
                    <FloatButton />
                    <FloatButton shape="round" />
                </div>
            );
            const [fromGlobal, explicit] = container.querySelectorAll(`.${prefixCls}`);
            expect(fromGlobal).toHaveClass(`${prefixCls}-square`, `${prefixCls}-small`);
            expect(explicit).toHaveClass(`${prefixCls}-round`, `${prefixCls}-small`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});

describe('FloatButtonGroup', () => {
    it('每个条目渲染一项，包含 value、icon 与 content', () => {
        const { container } = render(<FloatButtonGroup items={items} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(groupCls);
        expect(root).not.toHaveClass(`${groupCls}-disabled`);
        const rendered = root.querySelectorAll(`.${groupCls}-item`);
        expect(rendered).toHaveLength(2);
        expect(rendered[0]).toHaveAttribute('data-value', 'editor');
        expect(rendered[0]).toHaveTextContent('Editor');
        expect(rendered[0].querySelector('[data-testid="icon-editor"]')).not.toBeNull();
        expect(rendered[1]).toHaveAttribute('data-value', 'search');
    });

    it('带 badge 的项用 Badge 包裹', () => {
        const { container } = render(<FloatButtonGroup items={items} />);
        const badges = container.querySelectorAll('.semi-badge');
        expect(badges).toHaveLength(1);
        expect(badges[0].parentElement).toHaveClass(groupCls);
        expect(badges[0].querySelector(`.${groupCls}-item`)).toHaveAttribute('data-value', 'search');
        expect(badges[0].querySelector('.semi-badge-count')).toHaveTextContent('5');
    });

    it('应用 className、style 与 disabled 类名', () => {
        const { container } = render(<FloatButtonGroup className="custom" style={{ bottom: 50 }} disabled items={items} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(groupCls, 'custom', `${groupCls}-disabled`);
        expect(root).toHaveStyle({ bottom: '50px' });
    });

    it('调用 onClick 并传入被点击项的 value 与事件', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const { container } = render(<FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(container.querySelector(`[data-value="search"]`));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe('search');
        expect(onClick.mock.calls[0][1].type).toBe('click');
    });

    it('点击落在项内部元素上时，上报该项的 value', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const { getByTestId } = render(<FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(getByTestId('icon-editor'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe('editor');
    });

    it('忽略项以外的点击', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const { container } = render(<FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(container.firstElementChild);
        fireEvent.click(container.querySelector('.semi-badge-count'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('每项渲染为以 content 命名的原生按钮', () => {
        const { getAllByRole } = render(<FloatButtonGroup items={items} />);
        const buttons = getAllByRole('button');
        expect(buttons.map((button) => button.textContent)).toEqual(['Editor', 'Search']);
        buttons.forEach((button) => {
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveAttribute('type', 'button');
            expect(button).not.toBeDisabled();
        });
    });

    it('分组禁用时禁用每一项', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const itemClick = vi.fn<ClickHandler>();
        const { getAllByRole, getByRole } = render(<FloatButtonGroup disabled items={[...items, { content: 'Docs', value: 'docs', href: '#docs', onClick: itemClick }]} onClick={onClick} />);
        getAllByRole('button').forEach((button) => {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).toHaveClass(`${groupCls}-item-disabled`);
            fireEvent.click(button);
        });
        const link = getByRole('link', { name: 'Docs' });
        expect(link).not.toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(link);
        expect(onClick).not.toHaveBeenCalled();
        expect(itemClick).not.toHaveBeenCalled();
    });

    it('每项正确处理 href、disabled、onClick、shape、size、className、style 与 aria-label', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const editorClick = vi.fn<ClickHandler>();
        const searchClick = vi.fn<ClickHandler>();
        const { getByRole } = render(
            <FloatButtonGroup
                items={[
                    {
                        icon: <i />,
                        'aria-label': 'Editor',
                        value: 'editor',
                        onClick: editorClick,
                        shape: 'square',
                        size: 'large',
                        colorful: true,
                        className: 'item-custom',
                        style: { color: 'red' },
                    },
                    { content: 'Search', value: 'search', disabled: true, onClick: searchClick },
                    { content: 'Docs', value: 'docs', href: 'https://semi.design', target: '_blank', rel: 'noopener' },
                ]}
                onClick={onClick}
            />
        );
        const editor = getByRole('button', { name: 'Editor' });
        expect(editor).toHaveClass(`${groupCls}-item`, `${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, 'item-custom');
        expect(editor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        fireEvent.click(editor);
        expect(editorClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith('editor', expect.objectContaining({ type: 'click' }));
        expect(editorClick.mock.invocationCallOrder[0]).toBeLessThan(onClick.mock.invocationCallOrder[0]);

        const search = getByRole('button', { name: 'Search' });
        expect(search).toBeDisabled();
        expect(search).not.toHaveClass(`${prefixCls}-square`, `${prefixCls}-colorful`);
        fireEvent.click(search);
        expect(searchClick).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);

        const docs = getByRole('link', { name: 'Docs' });
        expect(docs).toHaveClass(`${groupCls}-item`);
        expect(docs).toHaveAttribute('href', 'https://semi.design');
        expect(docs).toHaveAttribute('target', '_blank');
        expect(docs).toHaveAttribute('rel', 'noopener');
        expect(docs).toHaveAttribute('data-value', 'docs');
    });

    it('分组可通过 aria-label 命名', () => {
        const { getByRole } = render(<FloatButtonGroup aria-label="Quick actions" items={items} />);
        expect(getByRole('group', { name: 'Quick actions' })).toHaveClass(groupCls);
    });

    it('类型不含被忽略的 button 专属属性', () => {
        for (const name of ['type', 'form', 'formAction', 'formEncType', 'formMethod', 'formNoValidate', 'formTarget'] as const) {
            expectTypeOf<FloatButtonProps>().not.toHaveProperty(name);
        }
        expectTypeOf<FloatButtonProps>().toHaveProperty('name');
    });

    it('不渲染 children，类型也不接受 children', () => {
        expectTypeOf<FloatButtonGroupProps>().not.toHaveProperty('children');
        expectTypeOf<FloatButtonProps>().not.toHaveProperty('children');
        // createElement does not check its children argument against the props, so the runtime case stays reachable
        const { container } = render(createElement(FloatButtonGroup, { items }, <span data-testid="child" />));
        expect(container.querySelector('[data-testid="child"]')).toBeNull();
    });

    it('data-* 与 id 等未知属性透传到根元素', () => {
        const { container } = render(<FloatButtonGroup id="group-id" data-testid="group" items={items} />);
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('data-testid', 'group');
        expect(root).toHaveAttribute('id', 'group-id');
    });

    it('ref 挂载到根 div', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<FloatButtonGroup ref={ref} items={items} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toBe(container.firstElementChild);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { FloatButtonGroup: { disabled: true } };
        try {
            const { container } = render(
                <div>
                    <FloatButtonGroup items={items} />
                    <FloatButtonGroup disabled={false} items={items} />
                </div>
            );
            const [fromGlobal, explicit] = container.querySelectorAll(`.${groupCls}`);
            expect(fromGlobal).toHaveClass(`${groupCls}-disabled`);
            expect(explicit).not.toHaveClass(`${groupCls}-disabled`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
