import React, { type ReactNode } from 'react';
import { IconMore } from '@fibrae/semi-icons-react';
import { Breadcrumb, Popover } from '@fibrae/semi-ui-react';

const separator = '-';

export default function BreadcrumbDemo() {
    const renderMore = (restItems: ReactNode[]) => {
        const content = (
            <>
                {restItems.map((item: ReactNode, idx: number) => (
                    <React.Fragment key={`restItem-${idx}`}>
                        {item}
                        {idx !== restItems.length - 1 && <span style={{ color: 'var(--semi-color-text-2)', marginInlineEnd: '6px' }}>{separator}</span>}
                    </React.Fragment>
                ))}
            </>
        );
        return (
            <Popover content={content} style={{ padding: 12 }} showArrow>
                <IconMore tabIndex={-1} />
            </Popover>
        );
    };
    return (
        <Breadcrumb renderMore={renderMore} onClick={(item, e) => console.log(item, e)}>
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
