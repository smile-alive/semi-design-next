import { For, Show } from 'solid-js';
import { IconMore } from '@fibrae/semi-icons-solid';
import { Breadcrumb, Popover, type BreadcrumbItemProps, type BreadcrumbRouteProps } from '@fibrae/semi-ui-solid';

const separator = '-'; // 拼接 restItems 用的分隔符

// restItems holds the props of the hidden Breadcrumb.Items, whose children the popover reads only when it opens
const renderMore = (restItems: Array<BreadcrumbRouteProps | BreadcrumbItemProps>) => (
    <Popover
        content={
            <For each={restItems}>
                {(item, index) => (
                    <>
                        {(item as BreadcrumbItemProps).children}
                        <Show when={index() !== restItems.length - 1}>
                            <span style={{ color: 'var(--semi-color-text-2)', 'margin-right': '6px' }}>{separator}</span>
                        </Show>
                    </>
                )}
            </For>
        }
        style={{ padding: '12px' }}
        showArrow
    >
        {/* the more button around the icon is already the Tab stop, so the icon itself is taken out of the Tab order */}
        {(trigger) => <IconMore {...trigger({ tabIndex: -1 })} />}
    </Popover>
);

export default function BreadcrumbDemo() {
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
