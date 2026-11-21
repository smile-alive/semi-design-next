import { For, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { type SidebarCodeContentPart, cssClasses, strings } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { IconCodeStroked, IconFile, IconFullScreenStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import CodeHighlight, { type CodeHighlightProps } from '@fibrae/semi-ui-solid/code-highlight/index';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
import JsonViewer, { type JsonViewerProps } from '@fibrae/semi-ui-solid/json-viewer/index';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import type { PartStyle, SideBarCollapseProps } from './interface';

const collapseCls = cssClasses.COLLAPSE;
const prefixCls = cssClasses.SIDEBAR;

export interface CodeItemProps extends ElementProps<'div'> {
    name?: string;
    /** Identifies the item's panel; a new key remounts the Sidebar detail */
    key?: string;
    isJson?: boolean;
    language?: string;
    content?: string;
    jsonViewerProps?: Partial<JsonViewerProps>;
    codeHighlightProps?: Partial<CodeHighlightProps>;
}

export interface CodeContentProps extends SideBarCollapseProps {
    classNames?: Partial<Record<SidebarCodeContentPart, string>>;
    styles?: Partial<Record<SidebarCodeContentPart, PartStyle>>;
    codes?: CodeItemProps[];
    onExpand?: (e: MouseEvent, code: CodeItemProps, mode: string) => void;
}

export function CodeItem(props: CodeItemProps) {
    const [local, rest] = splitProps(props, ['key', 'name', 'language', 'content', 'isJson', 'jsonViewerProps', 'codeHighlightProps', 'class']);

    return (
        <div {...rest} class={clsx(`${prefixCls}-code-content`, local.class)}>
            <Show when={local.isJson} fallback={<CodeHighlight code={local.content ?? ''} language={local.language ?? ''} {...local.codeHighlightProps} />}>
                <JsonViewer value={local.content} height="100%" options={strings.JSON_VIEWER_OPTIONS} showSearch={false} width="100%" {...local.jsonViewerProps} />
            </Show>
        </div>
    );
}

// Inside Collapse's toggle button: phrasing content only, no controls
export function CollapseHeader(props: { content: CodeItemProps; mode: string; class?: string; style?: PartStyle }) {
    return (
        <span class={clsx(`${collapseCls}-header-content`, props.class)} style={props.style}>
            <Show when={props.mode === 'code'} fallback={<IconFile />}>
                <IconCodeStroked />
            </Show>
            <span class={`${collapseCls}-header-text`}>{props.content.name}</span>
        </span>
    );
}

// the panel's extra sits beside the toggle button, not inside it
export function CollapseExpandButton<T extends CodeItemProps>(props: { content: T; mode: string; onExpand: (e: MouseEvent, item: T, mode: string) => void; class?: string; style?: PartStyle }) {
    const locale = useLocale('Sidebar');

    return <Button type="tertiary" class={clsx(`${collapseCls}-header-expand-btn`, props.class)} style={props.style} aria-label={locale().locale.expand} theme="borderless" icon={<IconFullScreenStroked />} onClick={(e) => props.onExpand(e, props.content, props.mode)} />;
}

export default function CodeContent(props: CodeContentProps) {
    const [local, rest] = splitProps(props, ['activeKey', 'codes', 'onExpand', 'class', 'classNames', 'styles', 'onChange']);

    return (
        <Collapse {...rest} class={clsx(collapseCls, `${collapseCls}-code`, local.class)} activeKey={local.activeKey} clickHeaderToExpand={false} onChange={local.onChange}>
            <For each={local.codes}>
                {(code) => (
                    <Collapse.Panel
                        header={<CollapseHeader class={local.classNames?.itemHeader} content={code} mode="code" style={local.styles?.itemHeader} />}
                        itemKey={code.key!}
                        extra={local.onExpand ? <CollapseExpandButton class={local.classNames?.itemExpand} content={code} mode="code" style={local.styles?.itemExpand} onExpand={local.onExpand} /> : undefined}
                    >
                        <CodeItem {...code} />
                    </Collapse.Panel>
                )}
            </For>
        </Collapse>
    );
}
