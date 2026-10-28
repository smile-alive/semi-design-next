import type { ReactElement } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Anchor, BackTop, Breadcrumb, Dropdown, FloatButton, FloatButtonGroup, HotKeys, Nav, Pagination, SplitButtonGroup, Steps, Tabs } from '@fibrae/semi-ui-react';

// Literal JSX attributes on purpose: spread props skip the excess-property check (F6 type half); runtime checks F2.
const onKeyDown = vi.fn<() => void>();
// A tab panel's id pairs it with its tab via aria-labelledby, so the component overrides the caller's
const replacedByComponent: Record<string, 'id'[]> = {
    'Tabs.TabPane': ['id'],
};
const cases: [string, () => ReactElement, string][] = [
    ['Anchor', () => <Anchor id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'anchor'],
    [
        'Anchor.Link',
        () => (
            <Anchor>
                <Anchor.Link id="probe" data-probe="" title="a" href="#a" onKeyDown={onKeyDown} />
            </Anchor>
        ),
        'anchor-link',
    ],
    ['Breadcrumb', () => <Breadcrumb id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'breadcrumb-wrapper'],
    [
        'Breadcrumb.Item',
        () => (
            <Breadcrumb>
                <Breadcrumb.Item id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />
            </Breadcrumb>
        ),
        'breadcrumb-item-wrap',
    ],
    ['Nav', () => <Nav id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'navigation'],
    [
        'Nav.Header',
        () => (
            <Nav>
                <Nav.Header id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />
            </Nav>
        ),
        'navigation-header',
    ],
    [
        'Nav.Footer',
        () => (
            <Nav>
                <Nav.Footer id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />
            </Nav>
        ),
        'navigation-footer',
    ],
    [
        'Nav.Item',
        () => (
            <Nav>
                <Nav.Item id="probe" data-probe="" title="t" itemKey="a" text="a" onKeyDown={onKeyDown} />
            </Nav>
        ),
        'navigation-item',
    ],
    [
        'Nav.Sub',
        () => (
            <Nav>
                <Nav.Sub id="probe" data-probe="" title="t" itemKey="a" text="a" onKeyDown={onKeyDown} />
            </Nav>
        ),
        'navigation-sub-wrap',
    ],
    ['Pagination', () => <Pagination id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'page'],
    ['Steps', () => <Steps id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'steps'],
    [
        'Steps.Step',
        () => (
            <Steps>
                <Steps.Step id="probe" data-probe="" onKeyDown={onKeyDown} />
            </Steps>
        ),
        'steps-item',
    ],
    ['Tabs', () => <Tabs id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'tabs'],
    [
        'Tabs.TabPane',
        () => (
            <Tabs>
                <Tabs.TabPane id="probe" data-probe="" title="t" itemKey="a" tab="a" onKeyDown={onKeyDown} />
            </Tabs>
        ),
        'tabs-pane',
    ],
    ['Tabs.TabItem', () => <Tabs.TabItem id="probe" data-probe="" title="t" itemKey="a" onKeyDown={onKeyDown} />, 'tabs-tab'],
    [
        'Dropdown.Menu',
        () => (
            <Dropdown.Menu id="probe" data-probe="" title="t" onKeyDown={onKeyDown}>
                {null}
            </Dropdown.Menu>
        ),
        'dropdown-menu',
    ],
    ['Dropdown.Item', () => <Dropdown.Item id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'dropdown-item'],
    ['Dropdown.Divider', () => <Dropdown.Divider id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'dropdown-divider'],
    ['Dropdown.Title', () => <Dropdown.Title id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'dropdown-title'],
    ['BackTop', () => <BackTop id="probe" data-probe="" title="t" visibilityHeight={-1} onKeyDown={onKeyDown} />, 'backtop'],
    ['FloatButton', () => <FloatButton id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'floatButton'],
    ['FloatButtonGroup', () => <FloatButtonGroup id="probe" data-probe="" title="t" items={[]} onKeyDown={onKeyDown} />, 'floatButtonGroup'],
    ['SplitButtonGroup', () => <SplitButtonGroup id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'button-split'],
    ['HotKeys', () => <HotKeys id="probe" data-probe="" title="t" hotKeys={['a']} onKeyDown={onKeyDown} />, 'hotKeys'],
];

describe('未声明属性落在接收 rest 的元素上，且 Props 类型接受', () => {
    it.each(cases)('%s', async (name, renderElement, cls) => {
        onKeyDown.mockClear();
        const { container } = render(renderElement());
        // BackTop renders only after its scroll listener runs
        const target = await waitFor(() => {
            const found = container.querySelector<HTMLElement>('[data-probe]');
            expect(found).not.toBeNull();
            return found;
        });
        const replaced = replacedByComponent[name] ?? [];
        expect(target).toHaveClass(`${BASE_CLASS_PREFIX}-${cls}`);
        expect(target.id === 'probe').toBe(!replaced.includes('id'));
        fireEvent.keyDown(target, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});
