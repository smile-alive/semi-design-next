import React, { useCallback } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { IconCodeStroked, IconFullScreenStroked, IconFile } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import Button from '@fibrae/semi-ui-react/button/index';
import CodeHighlight, { type CodeHighlightProps } from '@fibrae/semi-ui-react/code-highlight/index';
import Collapse from '@fibrae/semi-ui-react/collapse/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import JsonViewer, { type JsonViewerProps } from '@fibrae/semi-ui-react/json-viewer/index';
import type { SideBarCollapseProps } from '../interface';

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
export const CollapseHeader = React.memo(function CollapseHeader({ content, mode }: { content: CodeItemProps; mode: string }) {
    return (
        <span className={`${collapseCls}-header-content`}>
            {mode === 'code' ? <IconCodeStroked /> : <IconFile />}
            <span className={`${collapseCls}-header-text`}>{content.name}</span>
        </span>
    );
});

// the panel's extra sits beside the toggle button, not inside it
export const CollapseExpandButton = React.memo(function CollapseExpandButton({ content, onExpand, mode }: { content: CodeItemProps; mode: string; onExpand: (e: React.MouseEvent, code: CodeItemProps, mode: string) => void }) {
    const { locale } = useLocale('Sidebar');
    const handleExpand = useCallback(
        (e: React.MouseEvent) => {
            onExpand?.(e, content, mode);
        },
        [content, onExpand, mode]
    );
    return <Button type="tertiary" className={`${collapseCls}-header-expand-btn`} aria-label={locale.expand} theme="borderless" icon={<IconFullScreenStroked />} onClick={handleExpand} />;
});

function CodeContent({ activeKey, codes = [], onExpand, style, className, onChange, ...rest }: CodeContentProps) {
    return (
        <Collapse {...rest} className={clsx(collapseCls, `${collapseCls}-code`, { [className]: className })} style={style} activeKey={activeKey} clickHeaderToExpand={false} onChange={onChange}>
            {codes.map((code) => {
                const { key, ...item } = code;
                return (
                    <Collapse.Panel key={key} header={<CollapseHeader content={code} mode="code" />} itemKey={key} extra={onExpand ? <CollapseExpandButton content={code} mode="code" onExpand={onExpand} /> : undefined}>
                        <CodeItem {...item} />
                    </Collapse.Panel>
                );
            })}
        </Collapse>
    );
}

export default React.memo(CodeContent);
