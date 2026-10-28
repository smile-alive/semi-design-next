import React, { type ReactNode } from 'react';
import { IconMore } from '@fibrae/semi-icons-react';
import { Breadcrumb, Popover } from '@fibrae/semi-ui-react';

export default function BreadcrumbDemo() {
    const separator = '-'; // 拼接 restItem 用的分隔符
    const renderMore = (restItem: ReactNode[]) => {
        const content = (
            <>
                {restItem.map((item: ReactNode, idx: number) => (
                    <React.Fragment key={`restItem-${idx}`}>
                        {item}
                        {idx !== restItem.length - 1 && <span style={{ color: 'var(--semi-color-text-2)', marginRight: '6px' }}>{separator}</span>}
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
