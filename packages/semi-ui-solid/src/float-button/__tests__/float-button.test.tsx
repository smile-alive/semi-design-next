import { createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import FloatButton, { FloatButtonGroup, type FloatButtonElement, type FloatButtonGroupProps, type FloatButtonProps } from '..';
import semiGlobal from '../../_utils/semi-global';

type ClickHandler = (event: MouseEvent) => void;
type GroupClickHandler = (value: string | undefined, event: MouseEvent) => void;

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

const items = [
    { icon: <i data-testid="icon-editor" />, content: 'Editor', value: 'editor' },
    { icon: <i data-testid="icon-search" />, content: 'Search', value: 'search', badge: { count: 5 } },
];

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('FloatButton', () => {
    it('默认在根元素与 body 上渲染 round 与 default 尺寸类名', () => {
        const { container } = render(() => <FloatButton icon={<i data-testid="icon" />} />);
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-round`, `${prefixCls}-default`);
        const body = root.querySelector(`.${prefixCls}-body`) as HTMLElement;
        expect(body).toHaveClass(`${prefixCls}-round`, `${prefixCls}-default`);
        expect(body).not.toHaveClass(`${prefixCls}-colorful`);
        expect(body).not.toHaveClass(`${prefixCls}-disabled`);
        expect(body.querySelector('[data-testid="icon"]')).not.toBeNull();
    });

    it('应用 shape、size、colorful 与 disabled 类名', () => {
        const { container } = render(() => <FloatButton disabled colorful shape="square" size="large" />);
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`);
        expect(root).not.toHaveClass(`${prefixCls}-round`);
        const body = root.querySelector(`.${prefixCls}-body`);
        expect(body).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, `${prefixCls}-disabled`);
    });

    it('class 与 style 作用于根元素', () => {
        const { container } = render(() => <FloatButton class="custom" style={{ bottom: '20px' }} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ bottom: '20px' });
    });

    it('设置 badge 时用 Badge 包裹 body', () => {
        const { container } = render(() => (
            <div>
                <FloatButton badge={{ count: 1000, overflowCount: 999 }} />
                <FloatButton badge={{ dot: true, type: 'danger' }} />
                <FloatButton />
            </div>
        ));
        const [count, dot, plain] = container.querySelectorAll(`.${prefixCls}`);
        const countBadge = count.querySelector('.semi-badge') as HTMLElement;
        expect(countBadge.querySelector(`.${prefixCls}-body`)).not.toBeNull();
        expect(countBadge.querySelector('.semi-badge-count')).toHaveTextContent('999+');
        expect(dot.querySelector('.semi-badge-dot')).toHaveClass('semi-badge-danger');
        expect(plain.querySelector('.semi-badge')).toBeNull();
        expect(plain.firstElementChild).toHaveClass(`${prefixCls}-body`);
    });

    it('badge 可在运行时增减，图标保留', () => {
        const [badge, setBadge] = createSignal<FloatButtonProps['badge']>();
        const { container } = render(() => <FloatButton badge={badge()} icon={<i data-testid="icon" />} />);
        const root = container.querySelector(`.${prefixCls}`) as HTMLElement;
        expect(root.querySelector('.semi-badge')).toBeNull();

        setBadge({ count: 3 });
        expect(root.querySelector('.semi-badge .semi-badge-count')).toHaveTextContent('3');
        expect(root.querySelectorAll('[data-testid="icon"]')).toHaveLength(1);

        setBadge(undefined);
        expect(root.querySelector('.semi-badge')).toBeNull();
        expect(root.querySelectorAll('[data-testid="icon"]')).toHaveLength(1);
    });

    it('调用 onClick 并传入事件', () => {
        const onClick = vi.fn<ClickHandler>();
        const { container } = render(() => <FloatButton onClick={onClick} />);
        fireEvent.click(container.querySelector(`.${prefixCls}-body`) as Element);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('无 href 时渲染 type 为 button 的原生按钮', () => {
        render(() => <FloatButton aria-label="Edit" icon={<i />} />);
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toBeDisabled();
        expect(root).not.toHaveAttribute('aria-disabled');
        expect((root.querySelector(`.${prefixCls}-body`) as Element).tagName).toBe('SPAN');
    });

    it('渲染带 href、target 与 rel 的原生链接', () => {
        render(() => <FloatButton aria-label="Semi" href="https://semi.design" rel="noreferrer" target="_blank" />);
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://semi.design');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
        expect(link).not.toHaveAttribute('type');
    });

    it('链接上调用 onClick，且不阻止原生跳转', () => {
        const onClick = vi.fn<ClickHandler>();
        render(() => <FloatButton aria-label="Anchor" href="#float-button" onClick={onClick} />);
        let prevented: boolean | undefined;
        // Runs after Solid's delegated listener on the document; it also stops jsdom from navigating
        const listener = (event: Event) => {
            prevented = event.defaultPrevented;
            event.preventDefault();
        };
        document.addEventListener('click', listener);
        try {
            fireEvent.click(screen.getByRole('link', { name: 'Anchor' }));
        } finally {
            document.removeEventListener('click', listener);
        }
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(prevented).toBe(false);
    });

    it('原生禁用按钮，并跳过 onClick', () => {
        const onClick = vi.fn<ClickHandler>();
        render(() => <FloatButton aria-label="Edit" disabled onClick={onClick} />);
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root).toBeDisabled();
        expect(root).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(root.querySelector(`.${prefixCls}-body`) as Element);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('禁用链接变为不可跳转的链接，带 aria-disabled，并跳过 onClick', () => {
        const onClick = vi.fn<ClickHandler>();
        render(() => <FloatButton aria-label="Semi" disabled href="https://semi.design" target="_blank" onClick={onClick} />);
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).not.toHaveAttribute('href');
        expect(link).not.toHaveAttribute('target');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).not.toHaveAttribute('tabindex');
        fireEvent.click(link);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('data-* 与 id 等未声明属性透传到根元素', () => {
        const { container } = render(() => <FloatButton id="fb-id" data-testid="fb" aria-label="Edit" />);
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('data-testid', 'fb');
        expect(root).toHaveAttribute('id', 'fb-id');
        expect(root).toHaveAttribute('aria-label', 'Edit');
        expect(root).not.toHaveAttribute('href');
        expect(root).not.toHaveAttribute('target');
    });

    it('ref 挂载到根按钮或链接', () => {
        let buttonRef: FloatButtonElement | undefined;
        let linkRef: FloatButtonElement | undefined;
        const { container } = render(() => (
            <div>
                <FloatButton ref={(node) => (buttonRef = node)} />
                <FloatButton ref={(node) => (linkRef = node)} href="#top" />
            </div>
        ));
        const [button, link] = container.querySelectorAll(`.${prefixCls}`);
        expect(buttonRef).toBeInstanceOf(HTMLButtonElement);
        expect(buttonRef).toBe(button);
        expect(linkRef).toBeInstanceOf(HTMLAnchorElement);
        expect(linkRef).toBe(link);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { FloatButton: { shape: 'square', size: 'small' } };
        const { container } = render(() => (
            <div>
                <FloatButton />
                <FloatButton shape="round" />
            </div>
        ));
        const [fromGlobal, explicit] = container.querySelectorAll(`.${prefixCls}`);
        expect(fromGlobal).toHaveClass(`${prefixCls}-square`, `${prefixCls}-small`);
        expect(explicit).toHaveClass(`${prefixCls}-round`, `${prefixCls}-small`);
    });

    it('整体替换 props 时保留按钮节点与焦点', () => {
        const [props, setProps] = createSignal<FloatButtonProps>({ 'aria-label': 'Edit', title: 'a' });
        render(() => <FloatButton {...props()} />);
        const button = screen.getByRole('button', { name: 'Edit' });
        button.focus();
        setProps({ 'aria-label': 'Edit', title: 'b' });
        expect(screen.getByRole('button', { name: 'Edit' })).toBe(button);
        expect(button).toHaveFocus();
    });
});

describe('FloatButtonGroup', () => {
    it('每个条目渲染一项，包含 value、icon 与 content', () => {
        const { container } = render(() => <FloatButtonGroup items={items} />);
        const root = container.firstElementChild as HTMLElement;
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
        const { container } = render(() => <FloatButtonGroup items={items} />);
        const badges = container.querySelectorAll('.semi-badge');
        expect(badges).toHaveLength(1);
        expect(badges[0].parentElement).toHaveClass(groupCls);
        expect(badges[0].querySelector(`.${groupCls}-item`)).toHaveAttribute('data-value', 'search');
        expect(badges[0].querySelector('.semi-badge-count')).toHaveTextContent('5');
    });

    it('应用 class、style 与 disabled 类名', () => {
        const { container } = render(() => <FloatButtonGroup class="custom" style={{ bottom: '50px' }} disabled items={items} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(groupCls, 'custom', `${groupCls}-disabled`);
        expect(root).toHaveStyle({ bottom: '50px' });
    });

    it('调用 onClick 并传入被点击项的 value 与事件', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const { container } = render(() => <FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(container.querySelector(`[data-value="search"]`) as Element);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe('search');
        expect(onClick.mock.calls[0][1].type).toBe('click');
    });

    it('点击落在项内部元素上时，上报该项的 value', () => {
        const onClick = vi.fn<GroupClickHandler>();
        render(() => <FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(screen.getByTestId('icon-editor'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe('editor');
    });

    it('忽略项以外的点击', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const { container } = render(() => <FloatButtonGroup items={items} onClick={onClick} />);
        fireEvent.click(container.firstElementChild as Element);
        fireEvent.click(container.querySelector('.semi-badge-count') as Element);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('每项渲染为以 content 命名的原生按钮', () => {
        render(() => <FloatButtonGroup items={items} />);
        const buttons = screen.getAllByRole('button');
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
        render(() => <FloatButtonGroup disabled items={[...items, { content: 'Docs', value: 'docs', href: '#docs', onClick: itemClick }]} onClick={onClick} />);
        screen.getAllByRole('button').forEach((button) => {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).toHaveClass(`${groupCls}-item-disabled`);
            fireEvent.click(button);
        });
        const link = screen.getByRole('link', { name: 'Docs' });
        expect(link).not.toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(link);
        expect(onClick).not.toHaveBeenCalled();
        expect(itemClick).not.toHaveBeenCalled();
    });

    it('每项正确处理 href、disabled、onClick、shape、size、class、style 与 aria-label', () => {
        const onClick = vi.fn<GroupClickHandler>();
        const editorClick = vi.fn<ClickHandler>();
        const searchClick = vi.fn<ClickHandler>();
        render(() => (
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
                        class: 'item-custom',
                        style: { color: 'red' },
                    },
                    { content: 'Search', value: 'search', disabled: true, onClick: searchClick },
                    { content: 'Docs', value: 'docs', href: 'https://semi.design', target: '_blank', rel: 'noopener' },
                ]}
                onClick={onClick}
            />
        ));
        const editor = screen.getByRole('button', { name: 'Editor' });
        expect(editor).toHaveClass(`${groupCls}-item`, `${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, 'item-custom');
        expect(editor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        fireEvent.click(editor);
        expect(editorClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith('editor', expect.objectContaining({ type: 'click' }));
        expect(editorClick.mock.invocationCallOrder[0]).toBeLessThan(onClick.mock.invocationCallOrder[0]);

        const search = screen.getByRole('button', { name: 'Search' });
        expect(search).toBeDisabled();
        expect(search).not.toHaveClass(`${prefixCls}-square`, `${prefixCls}-colorful`);
        fireEvent.click(search);
        expect(searchClick).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);

        const docs = screen.getByRole('link', { name: 'Docs' });
        expect(docs).toHaveClass(`${groupCls}-item`);
        expect(docs).toHaveAttribute('href', 'https://semi.design');
        expect(docs).toHaveAttribute('target', '_blank');
        expect(docs).toHaveAttribute('rel', 'noopener');
        expect(docs).toHaveAttribute('data-value', 'docs');
    });

    it('items 变化时按位置更新各项', () => {
        const [list, setList] = createSignal([{ content: 'A', value: 'a' }]);
        render(() => <FloatButtonGroup items={list()} />);
        expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['A']);

        setList([
            { content: 'B', value: 'b' },
            { content: 'C', value: 'c', disabled: true },
        ]);
        const buttons = screen.getAllByRole('button');
        expect(buttons.map((button) => button.textContent)).toEqual(['B', 'C']);
        expect(buttons[0]).toHaveAttribute('data-value', 'b');
        expect(buttons[1]).toBeDisabled();
    });

    it('分组可通过 aria-label 命名', () => {
        render(() => <FloatButtonGroup aria-label="Quick actions" items={items} />);
        expect(screen.getByRole('group', { name: 'Quick actions' })).toHaveClass(groupCls);
    });

    it('类型不含被忽略的 button 专属属性', () => {
        for (const name of ['type', 'form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget'] as const) {
            expectTypeOf<FloatButtonProps>().not.toHaveProperty(name);
        }
        expectTypeOf<FloatButtonProps>().toHaveProperty('name');
    });

    it('不渲染 children，类型也不接受 children', () => {
        expectTypeOf<FloatButtonGroupProps>().not.toHaveProperty('children');
        expectTypeOf<FloatButtonProps>().not.toHaveProperty('children');
    });

    it('data-* 与 id 等未声明属性透传到根元素', () => {
        const { container } = render(() => <FloatButtonGroup id="group-id" data-testid="group" items={items} />);
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('data-testid', 'group');
        expect(root).toHaveAttribute('id', 'group-id');
    });

    it('ref 挂载到根 div', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <FloatButtonGroup ref={(node) => (ref = node)} items={items} />);
        expect(ref).toBeInstanceOf(HTMLDivElement);
        expect(ref).toBe(container.firstElementChild);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { FloatButtonGroup: { disabled: true } };
        const { container } = render(() => (
            <div>
                <FloatButtonGroup items={items} />
                <FloatButtonGroup disabled={false} items={items} />
            </div>
        ));
        const [fromGlobal, explicit] = container.querySelectorAll(`.${groupCls}`);
        expect(fromGlobal).toHaveClass(`${groupCls}-disabled`);
        expect(explicit).not.toHaveClass(`${groupCls}-disabled`);
    });
});
