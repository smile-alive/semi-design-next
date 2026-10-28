import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Anchor } from '@fibrae/semi-ui-react';
import { sleep } from '@test/utils/react';

const { Link } = Anchor;

const longTitle = '工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。';

const docLinks = (
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

const docSections = (
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
    render(
        <div>
            <Anchor style={{ position: 'absolute', right: 0, top: 100 }} getContainer={() => document.getElementById('box')} scrollMotion targetOffset={100}>
                {docLinks}
            </Anchor>
            <div id="box" style={{ height: '500px', overflow: 'scroll', border: '1px solid #eee' }}>
                <div style={{ position: 'fixed', border: '1px solid red', height: 100, width: '100%' }}>这是 fixed 的一段话</div>
                <h1 style={{ height: '300px' }}>whatever</h1>
                {docSections}
            </div>
        </div>
    );

const collapsibleLinks = (
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
        render(
            <>
                <Anchor onClick={() => screen.getByRole('button', { name: 'confirm' }).focus()}>
                    <Link title="Section A" href="#nowhere" />
                </Anchor>
                <button onClick={onConfirm}>confirm</button>
            </>
        );
        screen.getByRole('link', { name: 'Section A' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('FixContainerScrollBug1158：点击链接只滚动目标容器，不滚动其可滚动祖先', async () => {
        render(
            <div style={{ width: 300, height: 500, position: 'relative', overflowY: 'scroll' }} data-testid="outer">
                <Anchor style={{ position: 'absolute', right: 0 }} getContainer={() => document.getElementById('box')} scrollMotion>
                    <Link title="welcome" href="#welcome" />
                    <Link title="docs" href="#docs" />
                    <Link title="contact" href="#contact" />
                </Anchor>
                <div id="box" style={{ height: 700, overflowY: 'scroll' }}>
                    <h1 id="welcome" style={{ height: 300, margin: 0 }}>
                        Welcome
                    </h1>
                    <h2 id="docs" style={{ height: 200, margin: 0 }}>
                        Docs
                    </h2>
                    <h1 id="contact" style={{ height: 600, margin: 0 }}>
                        Contact me
                    </h1>
                </div>
            </div>
        );
        const outer = screen.getByTestId('outer');
        const box = document.getElementById('box');
        expect(outer.scrollHeight).toBeGreaterThan(outer.clientHeight);
        expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

        await userEvent.click(screen.getByRole('link', { name: 'docs' }));

        await waitFor(() => expect(box.scrollTop).toBe(300));
        expect(document.getElementById('docs').getBoundingClientRect().top).toBeCloseTo(box.getBoundingClientRect().top, 0);
        expect(outer.scrollTop).toBe(0);
    });

    it('显示 tooltip', async () => {
        render(
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
        );
        // vitest's locator generator cannot build a selector for the ellipsis span once its tooltip is open
        const [first, second] = screen.getAllByRole('link', { name: longTitle });
        await userEvent.hover(first);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(longTitle));
        await userEvent.unhover(first);

        await userEvent.hover(second);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper[x-placement="right"]`)).toHaveTextContent(longTitle));
    });

    it('显示 tooltip：链接内的省略号文本不是 Tab 停靠点', async () => {
        render(
            <Anchor showTooltip>
                <Link title="组件" href="#组件" />
                <Link title={longTitle} href="#显示工具提示" />
            </Anchor>
        );
        const links = screen.getAllByRole('link');
        const getText = () => links[1].querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`);
        // the ellipsis Tooltip remounts the text once the overflow is measured
        await waitFor(() => expect(getText()).toHaveAttribute('data-popupid'));
        const text = getText();
        const stops = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            stops.push(document.activeElement);
        }
        expect(stops.slice(0, 2)).toEqual(links);
        expect(stops).not.toContain(text);
    });

    it('按键', async () => {
        render(
            <div>
                <Anchor style={{ position: 'absolute', right: 0 }} getContainer={() => document.getElementById('box')} scrollMotion={false}>
                    {docLinks}
                </Anchor>
                <div id="box" style={{ height: '500px', overflow: 'scroll' }}>
                    {docSections}
                </div>
            </div>
        );
        const box = document.getElementById('box');
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
        const box = document.getElementById('box');
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('点击', async () => {
        renderTargetOffset();
        const box = document.getElementById('box');
        await userEvent.click(screen.getByRole('link', { name: 'api too much to show' }));
        await waitFor(() => {
            const offset = document.getElementById('api').getBoundingClientRect().top - box.getBoundingClientRect().top;
            expect(Math.abs(offset - 100)).toBeLessThanOrEqual(2);
        });
    });

    it('展开与收起子链接后，rail 高度跟随链接列表', async () => {
        render(<Anchor autoCollapse>{collapsibleLinks}</Anchor>);
        const slide = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`);
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`);
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

    it('CssOnlyRailHeight：新增链接后同一帧内 rail 高度已等于列表高度，无需等待任何回调', async () => {
        const Demo = ({ wide }: { wide: boolean }) => (
            <Anchor style={{ width: 160 }}>
                <Link title="welcome" href="#welcome" />
                {wide && <Link title="一行放不下、会在渲染时立即换行撑高列表的很长很长的标题" href="#long" />}
            </Anchor>
        );
        const { rerender } = render(<Demo wide={false} />);
        const slide = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`);
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`);

        rerender(<Demo wide />);
        // no waitFor: a ResizeObserver-based rail would still show the old height before its callback runs
        expect(slide().getBoundingClientRect().height).toBe(wrapper().getBoundingClientRect().height);
    });

    it('maxHeight 限制列表可滚动时，rail 高度等于内容总高且随内容整体滚动，滑块与激活链接对齐', async () => {
        const manyLinks = Array.from({ length: 15 }, (_, i) => <Link key={i} title={`l${i}`} href={`#l${i}`} />);
        render(
            <Anchor defaultAnchor="#l14" maxHeight={100}>
                {manyLinks}
            </Anchor>
        );
        const nav = screen.getByRole('navigation');
        const slide = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide`);
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-link-wrapper`);
        const bar = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`);
        const activeTitleTop = () => screen.getByRole('link', { name: 'l14' }).getBoundingClientRect().top;

        expect(slide.getBoundingClientRect().height).toBe(wrapper.getBoundingClientRect().height);
        expect(slide.getBoundingClientRect().height).toBeGreaterThan(nav.getBoundingClientRect().height);
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);

        nav.scrollTop = nav.scrollHeight - nav.clientHeight;
        await waitFor(() => expect(nav.scrollTop).toBeGreaterThan(0));
        expect(bar.getBoundingClientRect().top).toBeCloseTo(activeTitleTop(), 0);
    });

    it('容器已滚到底后点击底部链接，再向上滚动时高亮仍更新', async () => {
        render(
            <div>
                <Anchor style={{ position: 'absolute', right: 0 }} getContainer={() => document.getElementById('box')} scrollMotion={false}>
                    {docLinks}
                </Anchor>
                <div id="box" style={{ height: '500px', overflow: 'scroll' }}>
                    {docSections}
                </div>
            </div>
        );
        const box = document.getElementById('box');
        box.scrollTo(0, box.scrollHeight);
        await waitFor(() => expect(activeTitle()).toHaveTextContent('doc1'));

        await userEvent.click(screen.getByRole('link', { name: 'contact' }));
        await waitFor(() => expect(activeTitle()).toHaveTextContent('contact'));
        await sleep(250);

        box.scrollTo(0, 0);
        await waitFor(() => expect(activeTitle()).toBeNull());
    });

    it('自动折叠', async () => {
        render(
            <>
                <div id="collapse">
                    <Anchor autoCollapse>{collapsibleLinks}</Anchor>
                </div>
                <div id="no-collapse">
                    <Anchor autoCollapse={false}>{collapsibleLinks}</Anchor>
                </div>
            </>
        );
        const linkTitles = (id) => [...document.querySelectorAll(`#${id} .${BASE_CLASS_PREFIX}-anchor-link-title`)].map((el) => el.textContent);

        expect(linkTitles('collapse')).not.toContain('1.1 组件');
        await userEvent.click(within(document.getElementById('collapse')).getByRole('link', { name: '1. Semi Design' }));
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
            <>
                <Anchor>
                    <Link title="target" href="#shadow-target" />
                </Anchor>
                <div style={{ height: 3000 }} />
                <div id="shadow-target">target content</div>
            </>,
            { container: mount }
        );
        try {
            await userEvent.click(shadow.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-title`));
            await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
        } finally {
            view.unmount();
            host.remove();
            window.scrollTo(0, 0);
        }
    });
});
