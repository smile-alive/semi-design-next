import { type JSX, For, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { IconBookOpenStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
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
    activeKey?: string | string[];
    info?: AnnotationInfo[];
    /** A group's header after its icon */
    renderHeader?: (info: AnnotationInfo) => JSX.Element;
    renderItem?: (annotation: AnnotationItem) => JSX.Element;
    onChange?: (key: string | string[]) => void;
    onClick?: (e: MouseEvent, item: AnnotationItem) => void;
}

export default function Content(props: ContentProps) {
    const [local, rest] = splitProps(props, ['info', 'activeKey', 'onChange', 'onClick', 'class', 'renderHeader', 'renderItem']);

    return (
        <Collapse {...rest} class={clsx(collapseCls, local.class)} activeKey={local.activeKey} clickHeaderToExpand={false} onChange={local.onChange}>
            <For each={local.info}>
                {(item) => (
                    <Collapse.Panel
                        header={
                            // a span: Collapse renders the header inside its toggle button
                            <span class={`${collapseCls}-header-content`}>
                                <IconBookOpenStroked />
                                {local.renderHeader ? local.renderHeader(item) : item.header}
                            </span>
                        }
                        itemKey={item.key}
                    >
                        <div class={`${annotationCls}-content`}>
                            <For each={item.annotations}>
                                {(cite) => (
                                    <Show
                                        when={local.renderItem}
                                        keyed
                                        fallback={
                                            <Show when={cite.type === 'video'} fallback={<Item onClick={local.onClick} {...cite} />}>
                                                <VideoItem onClick={local.onClick} {...cite} />
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
