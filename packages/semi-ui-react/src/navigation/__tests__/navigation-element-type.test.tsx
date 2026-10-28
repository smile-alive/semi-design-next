import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Nav, { type NavItemProps, type SubNavProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-navigation`;
const getSubTitle = (text: string) => screen.getByText(text).closest<HTMLElement>(`.${prefixCls}-sub-title`);
const isOpen = (text: string) => getSubTitle(text).getAttribute('aria-expanded') === 'true';

describe('Nav 识别子项', () => {
    it('Nav.Header、Nav.Footer 的 elementType 取公开访问路径', () => {
        expect(Nav.Header.elementType).toBe('Nav.Header');
        expect(Nav.Footer.elementType).toBe('Nav.Footer');
    });

    it('透传 itemKey 的包装组件参与首次渲染的祖先展开与顶层选中，位于顶层时直接进入列表', () => {
        const WrappedItem = (props: NavItemProps) => <Nav.Item {...props} />;
        const WrappedSub = (props: SubNavProps) => <Nav.Sub {...props} />;
        render(
            <Nav defaultSelectedKeys={['inner']}>
                <WrappedSub itemKey="s" text="包装">
                    <Nav.Sub itemKey="t" text="内层">
                        <WrappedItem itemKey="inner" text="包装项" />
                    </Nav.Sub>
                </WrappedSub>
                <WrappedItem itemKey="top" text="顶层包装项" />
            </Nav>
        );
        expect(isOpen('包装')).toBe(true);
        expect(isOpen('内层')).toBe(true);
        expect(getSubTitle('包装')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(document.querySelector(`.${prefixCls}-list-extra`)).toBeNull();
    });
});
