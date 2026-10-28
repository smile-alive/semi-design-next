import { For, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { IconCodeStroked, IconFile, IconFullScreenStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import Button from '@fibrae/semi-ui-solid/button/index';
import CodeHighlight, { type CodeHighlightProps } from '@fibrae/semi-ui-solid/code-highlight/index';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import JsonViewer, { type JsonViewerProps } from '@fibrae/semi-ui-solid/json-viewer/index';
import type { SideBarCollapseProps } from '../interface';

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
export function CollapseHeader(props: { content: CodeItemProps; mode: string }) {
    return (
        <span class={`${collapseCls}-header-content`}>
            <Show when={props.mode === 'code'} fallback={<IconFile />}>
                <IconCodeStroked />
            </Show>
            <span class={`${collapseCls}-header-text`}>{props.content.name}</span>
        </span>
    );
}

// the panel's extra sits beside the toggle button, not inside it
export function CollapseExpandButton<T extends CodeItemProps>(props: { content: T; mode: string; onExpand: (e: MouseEvent, item: T, mode: string) => void }) {
    const locale = useLocale('Sidebar');

    return <Button type="tertiary" class={`${collapseCls}-header-expand-btn`} aria-label={locale().locale.expand} theme="borderless" icon={<IconFullScreenStroked />} onClick={(e) => props.onExpand(e, props.content, props.mode)} />;
}

export default function CodeContent(props: CodeContentProps) {
    const [local, rest] = splitProps(props, ['activeKey', 'codes', 'onExpand', 'class', 'onChange']);

    return (
        <Collapse {...rest} class={clsx(collapseCls, `${collapseCls}-code`, local.class)} activeKey={local.activeKey} clickHeaderToExpand={false} onChange={local.onChange}>
            <For each={local.codes}>
                {(code) => (
                    <Collapse.Panel header={<CollapseHeader content={code} mode="code" />} itemKey={code.key as string} extra={local.onExpand ? <CollapseExpandButton content={code} mode="code" onExpand={local.onExpand} /> : undefined}>
                        <CodeItem {...code} />
                    </Collapse.Panel>
                )}
            </For>
        </Collapse>
    );
}
