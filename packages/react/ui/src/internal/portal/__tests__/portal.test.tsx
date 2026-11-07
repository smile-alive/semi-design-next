import { Component, StrictMode, useLayoutEffect, useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ConfigContext } from '@fibrae/semi-ui-react/config-provider/context';
import Portal, { type PortalProps } from '../index';

const portalCls = `${BASE_CLASS_PREFIX}-portal`;

const renderStrict = () =>
    render(
        <StrictMode>
            <Portal>
                <span>x</span>
            </Portal>
        </StrictMode>
    );

describe('Portal', () => {
    it('把 children 渲染到追加在 document.body 下的容器中', () => {
        render(
            <Portal>
                <span>x</span>
            </Portal>
        );
        const portal = screen.getByText('x').parentNode;
        expect(portal).toHaveClass(portalCls);
        expect(portal.parentNode).toBe(document.body);
    });

    it('卸载时从 DOM 中移除容器元素', () => {
        const { unmount } = render(
            <Portal>
                <span>x</span>
            </Portal>
        );
        const portal = document.querySelector(`.${portalCls}`);
        expect(portal).toHaveTextContent('x');
        expect(portal.parentNode).toBe(document.body);
        unmount();
        expect(document.querySelector(`.${portalCls}`)).toBeNull();
    });

    it('在容器上设置 prefixCls、className 与 style', () => {
        render(
            <Portal className="extra" style={{ zIndex: 1031, color: 'red' }} prefixCls="custom">
                <span>x</span>
            </Portal>
        );
        const portal = screen.getByText('x').parentNode as HTMLElement;
        expect(portal.className).toBe('custom extra');
        expect(portal.style.zIndex).toBe('1031');
        expect(portal.style.color).toBe('red');
    });

    it('同步变化的 className 与 style 到容器，并移除已不存在的 style 键', () => {
        const { rerender } = render(
            <Portal className="a" style={{ zIndex: 1031, color: 'red' }}>
                <span>x</span>
            </Portal>
        );
        const portal = screen.getByText('x').parentNode as HTMLElement;
        rerender(
            <Portal className="b" style={{ zIndex: 2000 }}>
                <span>x</span>
            </Portal>
        );
        expect(screen.getByText('x').parentNode).toBe(portal);
        expect(portal.className).toBe(`${portalCls} b`);
        expect(portal.style.zIndex).toBe('2000');
        expect(portal.style.color).toBe('');
    });

    it('getPopupContainer 返回 null 时抛出指明原因的错误', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() =>
            render(
                <Portal getPopupContainer={() => null}>
                    <span>x</span>
                </Portal>
            )
        ).toThrow(/getPopupContainer/);
    });

    it('getPopupContainer 返回其他节点时移动容器', () => {
        const first = document.createElement('div');
        const second = document.createElement('div');
        document.body.append(first, second);
        const { rerender } = render(
            <Portal getPopupContainer={() => first}>
                <span>x</span>
            </Portal>
        );
        const portal = screen.getByText('x').parentNode;
        expect(portal.parentNode).toBe(first);
        rerender(
            <Portal getPopupContainer={() => second}>
                <span>x</span>
            </Portal>
        );
        expect(screen.getByText('x').parentNode).toBe(portal);
        expect(portal.parentNode).toBe(second);
        expect(first.childNodes).toHaveLength(0);
        first.remove();
        second.remove();
    });

    it('把容器追加到 getPopupContainer 返回的节点中', () => {
        const parent = document.createElement('div');
        document.body.appendChild(parent);
        const { unmount } = render(
            <Portal getPopupContainer={() => parent}>
                <span>x</span>
            </Portal>
        );
        expect(screen.getByText('x').parentNode.parentNode).toBe(parent);
        unmount();
        expect(parent.childNodes).toHaveLength(0);
        parent.remove();
    });

    it('回退到 ConfigContext 的 getPopupContainer，且属性可覆盖它', () => {
        const fromContext = document.createElement('div');
        const fromProp = document.createElement('div');
        document.body.append(fromContext, fromProp);
        render(
            <ConfigContext value={{ getPopupContainer: () => fromContext }}>
                <Portal>
                    <span>context</span>
                </Portal>
                <Portal getPopupContainer={() => fromProp}>
                    <span>prop</span>
                </Portal>
            </ConfigContext>
        );
        expect(screen.getByText('context').parentNode.parentNode).toBe(fromContext);
        expect(screen.getByText('prop').parentNode.parentNode).toBe(fromProp);
    });

    it('按 ConfigContext 的 direction 输出 dir，没有方向时不输出', () => {
        const { rerender } = render(
            <ConfigContext value={{ direction: 'rtl' }}>
                <Portal>
                    <span>x</span>
                </Portal>
            </ConfigContext>
        );
        expect(screen.getByText('x').parentNode).toHaveAttribute('dir', 'rtl');
        rerender(
            <ConfigContext value={{}}>
                <Portal>
                    <span>x</span>
                </Portal>
            </ConfigContext>
        );
        expect(screen.getByText('x').parentNode).not.toHaveAttribute('dir');
    });

    it('更新后以旧 props 调用 didUpdate，挂载时不调用', () => {
        const didUpdate = vi.fn<NonNullable<PortalProps['didUpdate']>>();
        const { rerender } = render(
            <Portal className="a" didUpdate={didUpdate}>
                <span>x</span>
            </Portal>
        );
        expect(didUpdate).not.toHaveBeenCalled();
        rerender(
            <Portal className="b" didUpdate={didUpdate}>
                <span>x</span>
            </Portal>
        );
        expect(didUpdate).toHaveBeenCalledTimes(1);
        expect(didUpdate.mock.calls[0][0]).toMatchObject({ className: 'a' });
    });

    it('children 挂载时容器已在文档中', () => {
        // Modal focuses its dialog in componentDidMount, which needs an attached node
        const seen = [];
        class ClassChild extends Component {
            ref = { current: null };
            override componentDidMount() {
                seen.push(document.body.contains(this.ref.current));
            }
            override render() {
                return <span ref={this.ref}>class</span>;
            }
        }
        function HookChild() {
            const ref = useRef(null);
            useLayoutEffect(() => {
                seen.push(document.body.contains(ref.current));
            }, []);
            return <span ref={ref}>hook</span>;
        }
        render(
            <Portal>
                <ClassChild />
                <HookChild />
            </Portal>
        );
        expect(seen).toEqual([true, true]);
    });

    it('基于同一次提交中更早设置的 ref 解析 getPopupContainer', () => {
        function App() {
            const ref = useRef(null);
            return (
                <>
                    <div ref={ref} data-testid="parent" />
                    <Portal getPopupContainer={() => ref.current}>
                        <span>x</span>
                    </Portal>
                </>
            );
        }
        render(<App />);
        expect(screen.getByText('x').parentNode.parentNode).toBe(screen.getByTestId('parent'));
    });

    it('StrictMode 模拟重新挂载后，重新挂载同一个容器元素', () => {
        const { unmount } = renderStrict();
        const portal = screen.getByText('x').parentNode;
        expect(portal).toHaveClass(portalCls);
        expect(portal.parentNode).toBe(document.body);
        unmount();
        expect(portal.parentNode).toBeNull();
    });

    it('StrictMode 挂载与卸载后不留下容器', () => {
        const before = document.querySelectorAll(`.${portalCls}`).length;
        renderStrict().unmount();
        expect(document.querySelectorAll(`.${portalCls}`)).toHaveLength(before);
    });
});
