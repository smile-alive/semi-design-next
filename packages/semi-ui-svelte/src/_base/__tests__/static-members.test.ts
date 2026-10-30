import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { Card, CardMeta } from '../../card/index.js';
import { Checkbox, CheckboxGroup } from '../../checkbox/index.js';
import { Collapse, CollapsePanel } from '../../collapse/index.js';
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownTitle } from '../../dropdown/index.js';
import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from '../../layout/index.js';
import { List, ListItem } from '../../list/index.js';
import { Nav, NavFooter, NavHeader, NavItem, SubNav } from '../../navigation/index.js';
import { Radio, RadioGroup } from '../../radio/index.js';
import { ScrollItem, ScrollList } from '../../scroll-list/index.js';
import { Skeleton, SkeletonAvatar, SkeletonButton, SkeletonImage, SkeletonParagraph, SkeletonTitle } from '../../skeleton/index.js';
import { TabItem, Tabs } from '../../tabs/index.js';
import { Typography, TypographyNumeral, TypographyParagraph, TypographyText, TypographyTitle } from '../../typography/index.js';
import StaticMembersFixture from './static-members-fixture.svelte';

describe('组件的静态成员与具名导出是同一个引用', () => {
    it.each([
        ['Card.Meta', Card.Meta, CardMeta],
        ['Checkbox.Group', Checkbox.Group, CheckboxGroup],
        ['Collapse.Panel', Collapse.Panel, CollapsePanel],
        ['Dropdown.Menu', Dropdown.Menu, DropdownMenu],
        ['Dropdown.Item', Dropdown.Item, DropdownItem],
        ['Dropdown.Divider', Dropdown.Divider, DropdownDivider],
        ['Dropdown.Title', Dropdown.Title, DropdownTitle],
        ['Layout.Header', Layout.Header, LayoutHeader],
        ['Layout.Footer', Layout.Footer, LayoutFooter],
        ['Layout.Content', Layout.Content, LayoutContent],
        ['Layout.Sider', Layout.Sider, LayoutSider],
        ['List.Item', List.Item, ListItem],
        ['Nav.Sub', Nav.Sub, SubNav],
        ['Nav.Item', Nav.Item, NavItem],
        ['Nav.Header', Nav.Header, NavHeader],
        ['Nav.Footer', Nav.Footer, NavFooter],
        ['Radio.Group', Radio.Group, RadioGroup],
        ['ScrollList.Item', ScrollList.Item, ScrollItem],
        ['Skeleton.Avatar', Skeleton.Avatar, SkeletonAvatar],
        ['Skeleton.Title', Skeleton.Title, SkeletonTitle],
        ['Skeleton.Button', Skeleton.Button, SkeletonButton],
        ['Skeleton.Paragraph', Skeleton.Paragraph, SkeletonParagraph],
        ['Skeleton.Image', Skeleton.Image, SkeletonImage],
        ['Tabs.TabItem', Tabs.TabItem, TabItem],
        ['Typography.Text', Typography.Text, TypographyText],
        ['Typography.Title', Typography.Title, TypographyTitle],
        ['Typography.Paragraph', Typography.Paragraph, TypographyParagraph],
        ['Typography.Numeral', Typography.Numeral, TypographyNumeral],
    ])('%s', (_name, member, named) => {
        expect(member).toBeDefined();
        expect(member).toBe(named);
    });

    it('模板里可以用点号写法渲染子组件', () => {
        render(StaticMembersFixture);

        expect(screen.getByTestId('header').tagName).toBe('HEADER');
        expect(screen.getByTestId('header').className).toContain('-layout-header');
        expect(screen.getByTestId('content').tagName).toBe('MAIN');
        expect(screen.getByTestId('footer').tagName).toBe('FOOTER');
    });
});
