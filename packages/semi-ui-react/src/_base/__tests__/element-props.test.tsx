import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Avatar, AvatarGroup, Badge, Banner, ButtonGroup, Card, Col, Divider, Empty, Layout, Row, Space } from '@fibrae/semi-ui-react';

// Literal JSX attributes on purpose: spread props skip the excess-property check (F6 type half); runtime checks F2.
const onKeyDown = vi.fn<() => void>();
const cases: [string, () => ReactElement, string][] = [
    ['Avatar', () => <Avatar id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'avatar'],
    ['AvatarGroup', () => <AvatarGroup id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'avatar-group'],
    ['Badge', () => <Badge id="probe" data-probe="" title="t" count={1} onKeyDown={onKeyDown} />, 'badge'],
    ['Banner', () => <Banner id="probe" data-probe="" onKeyDown={onKeyDown} />, 'banner'],
    ['ButtonGroup', () => <ButtonGroup id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'button-group'],
    ['Card', () => <Card id="probe" data-probe="" onKeyDown={onKeyDown} />, 'card'],
    ['Card.Meta', () => <Card.Meta id="probe" data-probe="" onKeyDown={onKeyDown} />, 'card-meta'],
    ['Divider', () => <Divider id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'divider'],
    ['Empty', () => <Empty id="probe" data-probe="" onKeyDown={onKeyDown} />, 'empty'],
    ['Space', () => <Space id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'space'],
    ['Row', () => <Row id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'row'],
    ['Col', () => <Col id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'col'],
    ['Layout', () => <Layout id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'layout'],
    ['Layout.Header', () => <Layout.Header id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'layout-header'],
    ['Layout.Content', () => <Layout.Content id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'layout-content'],
    ['Layout.Footer', () => <Layout.Footer id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'layout-footer'],
    ['Layout.Sider', () => <Layout.Sider id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'layout-sider'],
];

describe('未声明属性落在根元素上，且 Props 类型接受', () => {
    it.each(cases)('%s', (_, renderElement, cls) => {
        onKeyDown.mockClear();
        const { container } = render(renderElement());
        const root = container.querySelector<HTMLElement>('[data-probe]');
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-${cls}`);
        expect(root).toHaveAttribute('id', 'probe');
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});
