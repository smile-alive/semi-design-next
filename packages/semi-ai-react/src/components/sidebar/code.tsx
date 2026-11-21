import React, { useCallback } from 'react';
import clsx from 'clsx';
import { type SidebarCodeContentPart, cssClasses, strings } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { IconCodeStroked, IconFullScreenStroked, IconFile } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/base';
import Button from '@fibrae/semi-ui-react/button/index';
import CodeHighlight, { type CodeHighlightProps } from '@fibrae/semi-ui-react/code-highlight/index';
import Collapse from '@fibrae/semi-ui-react/collapse/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import JsonViewer, { type JsonViewerProps } from '@fibrae/semi-ui-react/json-viewer/index';
import type { SideBarCollapseProps } from './interface';

const collapseCls = cssClasses.COLLAPSE;
const prefixCls = cssClasses.SIDEBAR;

export interface CodeItemProps extends ElementProps<'div'> {
    name?: string;
    key?: string;
    isJson?: boolean;
    language?: string;
    content?: string;
    jsonViewerProps?: Partial<JsonViewerProps>;
    codeHighlightProps?: CodeHighlightProps;
}

export interface CodeContentProps extends SideBarCollapseProps {
    style?: React.CSSProperties;
    className?: string;
    classNames?: Partial<Record<SidebarCodeContentPart, string>>;
    styles?: Partial<Record<SidebarCodeContentPart, React.CSSProperties>>;
    codes?: CodeItemProps[];
    onExpand?: (e: React.MouseEvent, code: CodeItemProps, mode: string) => void;
}

export const CodeItem = React.memo(function CodeItem({ name, language, content, isJson, jsonViewerProps = {}, codeHighlightProps, className, ...rest }: CodeItemProps) {
    return (
        <div {...rest} className={clsx(`${prefixCls}-code-content`, className)}>
            {isJson ? <JsonViewer value={content} height="100%" options={strings.JSON_VIEWER_OPTIONS} showSearch={false} width="100%" {...jsonViewerProps} /> : <CodeHighlight code={content} language={language} {...codeHighlightProps} />}
        </div>
    );
});

// Inside Collapse's toggle button: phrasing content only, no controls
export const CollapseHeader = React.memo(function CollapseHeader({ content, mode, className, style }: { content: CodeItemProps; mode: string; className?: string; style?: React.CSSProperties }) {
    return (
        <span className={clsx(`${collapseCls}-header-content`, className)} style={style}>
            {mode === 'code' ? <IconCodeStroked /> : <IconFile />}
            <span className={`${collapseCls}-header-text`}>{content.name}</span>
        </span>
    );
});

// the panel's extra sits beside the toggle button, not inside it
export const CollapseExpandButton = React.memo(function CollapseExpandButton({ content, onExpand, mode, className, style }: { content: CodeItemProps; mode: string; onExpand: (e: React.MouseEvent, code: CodeItemProps, mode: string) => void; className?: string; style?: React.CSSProperties }) {
    const { locale } = useLocale('Sidebar');
    const handleExpand = useCallback(
        (e: React.MouseEvent) => {
            onExpand?.(e, content, mode);
        },
        [content, onExpand, mode]
    );
    return <Button type="tertiary" className={clsx(`${collapseCls}-header-expand-btn`, className)} style={style} aria-label={locale.expand} theme="borderless" icon={<IconFullScreenStroked />} onClick={handleExpand} />;
});

function CodeContent({ activeKey, codes = [], onExpand, style, className, classNames, styles, onChange, ...rest }: CodeContentProps) {
    return (
        <Collapse {...rest} className={clsx(collapseCls, `${collapseCls}-code`, className)} style={style} activeKey={activeKey} clickHeaderToExpand={false} onChange={onChange}>
            {codes.map((code) => {
                const { key, ...item } = code;
                return (
                    <Collapse.Panel
                        key={key}
                        header={<CollapseHeader className={classNames?.itemHeader} style={styles?.itemHeader} content={code} mode="code" />}
                        itemKey={key}
                        extra={onExpand ? <CollapseExpandButton className={classNames?.itemExpand} style={styles?.itemExpand} content={code} mode="code" onExpand={onExpand} /> : undefined}
                    >
                        <CodeItem {...item} />
                    </Collapse.Panel>
                );
            })}
        </Collapse>
    );
}

export default React.memo(CodeContent);
