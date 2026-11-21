import { type JSX, For, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { type AnnotationPart, cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { IconBookOpenStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/base';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
import type { PartStyle } from '../interface';
import Item, { type AnnotationItem, VideoItem } from './item';

const collapseCls = cssClasses.COLLAPSE;
const annotationCls = cssClasses.ANNOTATION;

export interface AnnotationInfo {
    /** Plain text; other content goes through `renderHeader` */
    header: string;
    key: string;
    annotations: AnnotationItem[];
}

export interface ContentProps extends ElementProps<'div', 'onChange' | 'onClick'> {
    classNames?: Partial<Record<AnnotationPart, string>>;
    styles?: Partial<Record<AnnotationPart, PartStyle>>;
    activeKey?: string | string[];
    info?: AnnotationInfo[];
    renderHeader?: (info: AnnotationInfo) => JSX.Element;
    renderItem?: (annotation: AnnotationItem) => JSX.Element;
    onChange?: (key: string | string[]) => void;
    onClick?: (e: MouseEvent, item: AnnotationItem) => void;
}

export default function Content(props: ContentProps) {
    const [local, rest] = splitProps(props, ['info', 'activeKey', 'onChange', 'onClick', 'class', 'classNames', 'styles', 'renderHeader', 'renderItem']);

    return (
        <Collapse {...rest} class={clsx(collapseCls, local.class)} activeKey={local.activeKey} clickHeaderToExpand={false} onChange={local.onChange}>
            <For each={local.info}>
                {(item) => (
                    <Collapse.Panel
                        header={
                            // a span: Collapse renders the header inside its toggle button
                            <span class={clsx(`${collapseCls}-header-content`, local.classNames?.groupHeader)} style={local.styles?.groupHeader}>
                                <IconBookOpenStroked />
                                {local.renderHeader ? local.renderHeader(item) : item.header}
                            </span>
                        }
                        itemKey={item.key}
                    >
                        <div class={clsx(`${annotationCls}-content`, local.classNames?.groupContent)} style={local.styles?.groupContent}>
                            <For each={item.annotations}>
                                {(cite) => (
                                    <Show
                                        when={local.renderItem}
                                        keyed
                                        fallback={
                                            <Show when={cite.type === 'video'} fallback={<Item classNames={local.classNames} styles={local.styles} onClick={local.onClick} {...cite} />}>
                                                <VideoItem classNames={local.classNames} styles={local.styles} onClick={local.onClick} {...cite} />
                                            </Show>
                                        }
                                    >
                                        {(render) => render(cite)}
                                    </Show>
                                )}
                            </For>
                        </div>
                    </Collapse.Panel>
                )}
            </For>
        </Collapse>
    );
}
