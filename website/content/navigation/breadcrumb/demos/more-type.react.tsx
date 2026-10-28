import { Breadcrumb } from '@fibrae/semi-ui-react';

export default function BreadcrumbDemo() {
    return (
        <Breadcrumb moreType="popover">
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>当层级很多的时候</Breadcrumb.Item>
            <Breadcrumb.Item>又一层</Breadcrumb.Item>
            <Breadcrumb.Item>再一层</Breadcrumb.Item>
            <Breadcrumb.Item>上上一层</Breadcrumb.Item>
            <Breadcrumb.Item>上一层</Breadcrumb.Item>
            <Breadcrumb.Item>详情页</Breadcrumb.Item>
        </Breadcrumb>
    );
}
