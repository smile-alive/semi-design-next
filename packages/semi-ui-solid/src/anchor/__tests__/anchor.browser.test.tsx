import { For, createSignal } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import Anchor, { type AnchorProps } from '..';

const { Link } = Anchor;

const longTitle = '工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。';

const DocLinks = () => (
    <>
        <Link title="welcome" href="#welcome" />
        <Link title="api too much to show" href="#api">
            <Link title="docs" href="#docs">
                <Link title="doc1" href="#doc1" />
                <Link title="doc2" href="#doc2" />
            </Link>
        </Link>
        <Link title="contact" href="#contact" />
    </>
);

const DocSections = () => (
    <>
        <h1 id="welcome" style={{ height: '300px' }}>
            Welcome
        </h1>
        <h1 id="api" style={{ height: '300px' }}>
            API
        </h1>
        <h2 id="docs" style={{ height: '200px' }}>
            Docs
        </h2>
        <h3 id="doc1" style={{ height: '100px' }}>
            Doc1
        </h3>
        <h3 id="doc2" style={{ height: '100px' }}>
            Doc2
        </h3>
        <h1 id="contact" style={{ height: '300px' }}>
            Contact me
        </h1>
    </>
);

const renderTargetOffset = () =>
    render(() => (
        <div>
            <Anchor style={{ position: 'absolute', right: '0', top: '100px' }} getContainer={() => document.getElementById('box')} scrollMotion targetOffset={100}>
                <DocLinks />
            </Anchor>
            <div id="box" style={{ height: '500px', overflow: 'scroll', border: '1px solid #eee' }}>
                <div style={{ position: 'fixed', border: '1px solid red', height: '100px', width: '100%' }}>这是 fixed 的一段话</div>
                <h1 style={{ height: '300px' }}>whatever</h1>
                <DocSections />
            </div>
        </div>
    ));

const CollapsibleLinks = () => (
    <>
        <Link title="1. Semi Design" href="#Semi Design">
            <Link title="1.1 组件" href="#组件">
                <Link title="1.1.1 Avatar" href="#头像" />
                <Link title="1.1.2 Button" href="#按钮" />
                <Link title="1.1.3 Icon" href="#图标" />
            </Link>
            <Link title="1.2 物料" href="#物料" />
            <Link title="1.3 主题商店" href="#主题商店" />
        </Link>
        <Link title="2. 设计语言" href="#设计语言" />
    </>
);

const activeTitle = () => document.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-title-active`);

describe('Anchor（浏览器）', () => {
    it('在链接上按 Enter 不会按下 onClick 移走焦点的那个按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        render(() => (
            <>
                <Anchor onClick={() => screen.getByRole('button', { name: 'confirm' }).focus()}>
                    <Link title="Section A" href="#nowhere" />
                </Anchor>
                <button onClick={onConfirm}>confirm</button>
            </>
        ));
        screen.getByRole('link', { name: 'Section A' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('FixContainerScrollBug1158：点击链接只滚动目标容器，不滚动其可滚动祖先', async () => {
        render(() => (
            <div style={{ width: '300px', height: '500px', position: 'relative', 'overflow-y': 'scroll' }} data-testid="outer">
                <Anchor style={{ position: 'absolute', right: '0' }} getContainer={() => document.getElementById('box')} scrollMotion>
                    <Link title="welcome" href="#welcome" />
                    <Link title="docs" href="#docs" />
                    <Link title="contact" href="#contact" />
                </Anchor>
                <div id="box" style={{ height: '700px', 'overflow-y': 'scroll' }}>
                    <h1 id="welcome" style={{ height: '300px', margin: '0' }}>
                        Welcome
                    </h1>
                    <h2 id="docs" style={{ height: '200px', margin: '0' }}>
                        Docs
                    </h2>
                    <h1 id="contact" style={{ height: '600px', margin: '0' }}>
                        Contact me
                    </h1>
                </div>
            </div>
        ));
        const outer = screen.getByTestId('outer');
        const box = document.getElementById('box') as HTMLElement;
        expect(outer.scrollHeight).toBeGreaterThan(outer.clientHeight);
        expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

        await userEvent.click(screen.getByRole('link', { name: 'docs' }));

        await waitFor(() => expect(box.scrollTop).toBe(300));
        expect((document.getElementById('docs') as HTMLElement).getBoundingClientRect().top).toBeCloseTo(box.getBoundingClientRect().top, 0);
        expect(outer.scrollTop).toBe(0);
    });

    it('显示 tooltip', async () => {
        render(() => (
            <div>
                <Anchor showTooltip>
                    <Link title="组件" href="#组件" />
                    <Link title={longTitle} href="#显示工具提示" />
                </Anchor>
                <Anchor position="right" showTooltip>
                    <Link title="组件" href="#组件" />
                    <Link title={longTitle} href="#工具提示位置" />
                </Anchor>
            </div>
        ));
        // vitest's locator generator cannot build a selector for the ellipsis span once its tooltip is open
        const [first, second] = screen.getAllByRole('link', { name: longTitle });
        await userEvent.hover(first);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(longTitle));
        await userEvent.unhover(first);

        await userEvent.hover(second);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper[x-placement="right"]`)).toHaveTextContent(longTitle));
    });

    it('显示 tooltip：链接内的省略号文本不是 Tab 停靠点', async () => {
        render(() => (
            <Anchor showTooltip>
                <Link title="组件" href="#组件" />
                <Link title={longTitle} href="#显示工具提示" />
            </Anchor>
        ));
        const links = screen.getAllByRole('link');
        const getText = () => links[1].querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`);
        await waitFor(() => expect(getText()).toHaveAttribute('data-popupid'));
        const text = getText();
        const stops: Element[] = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            stops.push(document.activeElement as Element);
        }
        expect(stops[0]).toBe(links[0]);
        expect(stops[1]).toBe(links[1]);
        expect(stops).not.toContain(text);
    });

    it('按键', async () => {
        render(() => (
            <div>
                <Anchor style={{ position: 'absolute', right: '0' }} getContainer={() => document.getElementById('box')} scrollMotion={false}>
                    <DocLinks />
                </Anchor>
                <div id="box" style={{ height: '500px', overflow: 'scroll' }}>
                    <DocSections />
                </div>
            </div>
        ));
        const box = document.getElementById('box') as HTMLElement;
        screen.getByRole('link', { name: 'contact' }).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(box.scrollTop).toBe(0);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(box.scrollTop).toBe(box.scrollHeight - box.clientHeight));
        const contact = screen.getByRole('heading', { name: 'Contact me' }).getBoundingClientRect();
        expect(contact.bottom).toBeLessThanOrEqual(box.getBoundingClientRect().bottom);
    });

    it('滚动', async () => {
        renderTargetOffset();
        const box = document.getElementById('box') as HTMLElement;
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('点击', async () => {
        renderTargetOffset();
        const box = document.getElementById('box') as HTMLElement;
        await userEvent.click(screen.getByRole('link', { name: 'api too much to show' }));
        await waitFor(() => {
            const offset = (document.getElementById('api') as HTMLElement).getBoundingClientRect().top - box.getBoundingClientRect().top;
            expect(Math.abs(offset - 100)).toBeLessThanOrEqual(2);
        });
    });

    it('展开与收起子链接后，rail 高度跟随链接列表', async () => {
        render(() => (
            <Anchor autoCollapse>
                <CollapsibleLinks />
            </Anchor>
        ));
        const slide = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`) as HTMLElement;
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`) as HTMLElement;
        const railHeight = () => slide().getBoundingClientRect().height;
        const listHeight = () => wrapper().getBoundingClientRect().height;
        const collapsedHeight = listHeight();
        expect(railHeight()).toBe(collapsedHeight);

        await userEvent.click(screen.getByRole('link', { name: '1. Semi Design' }));
        await waitFor(() => expect(listHeight()).toBeGreaterThan(collapsedHeight));
        expect(railHeight()).toBe(listHeight());

        await userEvent.click(screen.getByRole('link', { name: '2. 设计语言' }));
        await waitFor(() => expect(listHeight()).toBe(collapsedHeight));
        expect(railHeight()).toBe(collapsedHeight);
    });

    it('CssOnlyRailHeight：新增链接后同一帧内 rail 高度已等于列表高度，无需等待任何回调', () => {
        const [wide, setWide] = createSignal(false);
        render(() => (
            <Anchor style={{ width: '160px' }}>
                <Link title="welcome" href="#welcome" />
                {wide() && <Link title="一行放不下、会在渲染时立即换行撑高列表的很长很长的标题" href="#long" />}
            </Anchor>
        ));
        const slide = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`) as HTMLElement;
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`) as HTMLElement;

        setWide(true);
        // no waitFor: a ResizeObserver-based rail would still show the old height before its callback runs
        expect(slide().getBoundingClientRect().height).toBe(wrapper().getBoundingClientRect().height);
    });

    it('maxHeight 限制列表可滚动时，rail 高度等于内容总高且随内容整体滚动，滑块与激活链接对齐', async () => {
        render(() => (
            <Anchor defaultAnchor="#l14" maxHeight={100}>
                <For each={Array.from({ length: 15 }, (_, i) => i)}>{(i) => <Link title={`l${i}`} href={`#l${i}`} />}</For>
            </Anchor>
        ));
        const nav = screen.getByRole('navigation');
        const slide = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`) as HTMLElement;
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`) as HTMLElement;
        const bar = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`) as HTMLElement;
        const activeTitleTop = () => screen.getByRole('link', { name: 'l14' }).getBoundingClientRect().top;

        expect(slide.getBoundingClientRect().height).toBe(wrapper.getBoundingClientRect().height);
        expect(slide.getBoundingClientRect().height).toBeGreaterThan(nav.getBoundingClientRect().height);
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);

        nav.scrollTop = nav.scrollHeight - nav.clientHeight;
        await waitFor(() => expect(nav.scrollTop).toBeGreaterThan(0));
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);
    });

    it('容器已滚到底后点击底部链接，再向上滚动时高亮仍更新', async () => {
        render(() => (
            <div>
                <Anchor style={{ position: 'absolute', right: '0' }} getContainer={() => document.getElementById('box')} scrollMotion={false}>
                    <DocLinks />
                </Anchor>
                <div id="box" style={{ height: '500px', overflow: 'scroll' }}>
                    <DocSections />
                </div>
            </div>
        ));
        const box = document.getElementById('box') as HTMLElement;
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        await userEvent.click(screen.getByRole('link', { name: 'contact' }));
        await waitFor(() => expect(activeTitle()).toHaveTextContent('contact'));
        await sleep(250);

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('自动折叠', async () => {
        render(() => (
            <>
                <div id="collapse">
                    <Anchor autoCollapse>
                        <CollapsibleLinks />
                    </Anchor>
                </div>
                <div id="no-collapse">
                    <Anchor autoCollapse={false}>
                        <CollapsibleLinks />
                    </Anchor>
                </div>
            </>
        ));
        const linkTitles = (id: string) => [...document.querySelectorAll(`#${id} .${BASE_CLASS_PREFIX}-anchor-link-title`)].map((el) => el.textContent);

        expect(linkTitles('collapse')).not.toContain('1.1 组件');
        await userEvent.click(within(document.getElementById('collapse') as HTMLElement).getByRole('link', { name: '1. Semi Design' }));
        await waitFor(() => expect(linkTitles('collapse')).toEqual(expect.arrayContaining(['1.1 组件', '1.2 物料', '1.3 主题商店'])));

        expect(linkTitles('no-collapse')).toEqual(expect.arrayContaining(['1.1 组件', '1.1.1 Avatar', '1.1.2 Button', '1.1.3 Icon']));
    });

    it('ShadowRoot 内点击链接滚动到同一 ShadowRoot 内的目标', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            () => (
                <>
                    <Anchor>
                        <Link title="target" href="#shadow-target" />
                    </Anchor>
                    <div style={{ height: '3000px' }} />
                    <div id="shadow-target">target content</div>
                </>
            ),
            { container: mount }
        );
        try {
            await userEvent.click(shadow.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-title`) as Element);
            await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
        } finally {
            view.unmount();
            host.remove();
            window.scrollTo(0, 0);
        }
    });
});

describe('Anchor scrollIntoViewOptions（浏览器）', () => {
    const renderBox = (props: Pick<AnchorProps, 'scrollIntoViewOptions' | 'targetOffset'>) => {
        render(() => (
            <>
                <Anchor getContainer={() => document.getElementById('box')} scrollIntoViewOptions={props.scrollIntoViewOptions} targetOffset={props.targetOffset}>
                    <Link title="docs" href="#docs" />
                </Anchor>
                <div id="box" style={{ height: '200px', width: '200px', overflow: 'auto' }}>
                    <div style={{ height: '300px', width: '600px' }} />
                    <h2 id="docs" style={{ margin: '0 0 0 400px', height: '40px', width: '100px' }}>
                        Docs
                    </h2>
                    <div style={{ height: '600px' }} />
                </div>
            </>
        ));
        const box = document.getElementById('box') as HTMLElement;
        // the target's top inside the visible part of the box
        const offset = () => (document.getElementById('docs') as HTMLElement).getBoundingClientRect().top - box.getBoundingClientRect().top;
        return { box, offset };
    };

    it('默认把目标滚动到容器顶部，不横向滚动', async () => {
        const { box, offset } = renderBox({});
        await userEvent.click(screen.getByRole('link', { name: 'docs' }));
        await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
        expect(offset()).toBeCloseTo(0, 0);
        expect(box.scrollLeft).toBe(0);
    });

    it('block 可覆盖默认值，inline 让容器横向滚动', async () => {
        const { box, offset } = renderBox({ scrollIntoViewOptions: { block: 'center', inline: 'start' } });
        await userEvent.click(screen.getByRole('link', { name: 'docs' }));
        await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
        expect(offset() + 20).toBeCloseTo(box.clientHeight / 2, 0);
        expect(box.scrollLeft).toBeGreaterThan(0);
    });

    it('targetOffset 从滚动位置中减去', async () => {
        const { box, offset } = renderBox({ targetOffset: 50 });
        await userEvent.click(screen.getByRole('link', { name: 'docs' }));
        await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
        expect(offset()).toBeCloseTo(50, 0);
    });
});
