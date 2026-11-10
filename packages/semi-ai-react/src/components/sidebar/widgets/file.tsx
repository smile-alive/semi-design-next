import React, { useMemo, useState } from 'react';
import type { Extensions } from '@tiptap/core';
import { type Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import {
    type FileMenuButtonKey,
    type FileMenuItem,
    type Level,
    type TextRange,
    canUploadImage,
    clearSelectionHighlight,
    confirmLink,
    getEditorAttributes,
    getFileEditorExtensions,
    getFileMenuItems,
    readFileMenuState,
    readLinkEditorOpenState,
    unsetLink,
} from '@fibrae/semi-ai-foundation/components/sidebar/file-extensions';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import {
    IconH1,
    IconHn,
    IconH2,
    IconH3,
    IconH4,
    IconH5,
    IconH6,
    IconList,
    IconOrderedList,
    IconQuote,
    IconLink,
    IconItalic,
    IconStrikeThrough,
    IconText,
    IconBold,
    IconCode,
    IconTerminal,
    IconMinus,
    IconUndo,
    IconRedo,
    IconCheckCircleStroked,
    IconDeleteStroked,
    IconAlignLeft,
    IconAlignJustify,
    IconAlignCenter,
    IconAlignRight,
    IconImage,
} from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/base/base';
import Button, { type ButtonProps } from '@fibrae/semi-ui-react/button/index';
import Collapse from '@fibrae/semi-ui-react/collapse/index';
import Divider from '@fibrae/semi-ui-react/divider/index';
import Dropdown, { type DropdownItemProps } from '@fibrae/semi-ui-react/dropdown/index';
import { useDidUpdate, useLocale } from '@fibrae/semi-ui-react/hooks';
import Input from '@fibrae/semi-ui-react/input/index';
import Toast from '@fibrae/semi-ui-react/toast/index';
import type { SideBarCollapseProps } from '../interface';
import { CollapseExpandButton, CollapseHeader } from './code';
import { type ImageUploadNodeOptions, ImageUploadNode } from './image-slot';

const collapseCls = cssClasses.COLLAPSE;
const prefixCls = cssClasses.FILE;

export interface FileItemProps extends ElementProps<'div'> {
    key?: string;
    className?: string;
    name?: string;
    style?: React.CSSProperties;
    editable?: boolean;
    content?: string;
    onContentChange?: (content: string) => void;
    extensions?: Extensions;
    imgUploadProps?: ImageUploadNodeOptions;
}

interface ConfigureButtonProps extends ButtonProps {
    active?: boolean;
}

// elementType lets a Dropdown tell this is a button and put aria-haspopup and aria-expanded on it
const ConfigureButton = Object.assign(
    function ConfigureButton({ active, className, ...rest }: ConfigureButtonProps) {
        return (
            <Button
                {...rest}
                type="tertiary"
                className={clsx(`${prefixCls}-menu-bar-btn`, {
                    [`${prefixCls}-menu-bar-btn-active`]: active,
                    [className]: className,
                })}
                theme="borderless"
            />
        );
    },
    { elementType: 'Button' }
);

function ConfigureDropdownItem({ active, children, className, ...rest }: DropdownItemProps) {
    return (
        <Dropdown.Item
            {...rest}
            className={clsx(`${prefixCls}-menu-bar-dropdown-item`, className, {
                [`${prefixCls}-menu-bar-dropdown-item-active`]: active,
            })}
            active={active}
        >
            {children}
        </Dropdown.Item>
    );
}

const HEADINGS = [IconH1, IconH2, IconH3, IconH4, IconH5, IconH6].map((Icon, index) => ({ Icon, level: (index + 1) as Level }));

const MENU_ICONS: Record<FileMenuButtonKey, React.ComponentType> = {
    undo: IconUndo,
    redo: IconRedo,
    paragraph: IconText,
    bulletList: IconList,
    orderedList: IconOrderedList,
    blockquote: IconQuote,
    codeBlock: IconTerminal,
    horizontalRule: IconMinus,
    alignLeft: IconAlignLeft,
    alignCenter: IconAlignCenter,
    alignRight: IconAlignRight,
    alignJustify: IconAlignJustify,
    bold: IconBold,
    italic: IconItalic,
    strike: IconStrikeThrough,
    code: IconCode,
    image: IconImage,
};

function MenuBar({ editor, className, canUpload }: { editor: Editor; className: string; canUpload: boolean }) {
    const { locale: menuLocale } = useLocale('Sidebar');

    const [linkDropdownVisible, setLinkDropdownVisible] = useState(false);
    const [linkInputValue, setLinkInputValue] = useState('');
    const [linkSelectionRange, setLinkSelectionRange] = useState<TextRange | null>(null);

    const editorState = useEditorState({ editor, selector: (ctx) => readFileMenuState(ctx.editor) });

    const handleConfirmLink = () => {
        if (!confirmLink(editor, linkInputValue.trim(), linkSelectionRange)) {
            return;
        }
        Toast.success(menuLocale.linkAddSuccess);
        setLinkDropdownVisible(false);
        setLinkSelectionRange(null);
    };

    const handleUnsetLink = () => {
        unsetLink(editor);
        Toast.success(menuLocale.linkRemoveSuccess);
        setLinkDropdownVisible(false);
        setLinkSelectionRange(null);
    };

    const renderItem = (item: FileMenuItem, index: number) => {
        if (item.type === 'divider') {
            return <Divider key={index} layout="vertical" />;
        }
        if (item.type === 'heading') {
            return (
                <Dropdown
                    key={index}
                    render={
                        <Dropdown.Menu>
                            {HEADINGS.map(({ Icon, level }) => (
                                <ConfigureDropdownItem key={level} aria-label={formatLocale(menuLocale.headingLevel, { level })} active={editorState.headingLevel === level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()}>
                                    <Icon />
                                </ConfigureDropdownItem>
                            ))}
                        </Dropdown.Menu>
                    }
                >
                    <ConfigureButton aria-label={menuLocale.heading} active={editorState.isHeading} icon={<IconHn />} />
                </Dropdown>
            );
        }
        if (item.type === 'button') {
            const Icon = MENU_ICONS[item.key];
            const active = item.activeKey ? editorState[item.activeKey] : undefined;
            return <ConfigureButton key={item.key} aria-label={menuLocale[item.key]} aria-pressed={active} disabled={item.enabledKey !== undefined && !editorState[item.enabledKey]} active={active} icon={<Icon />} onClick={() => item.command(editor.chain().focus()).run()} />;
        }
        return (
            <Dropdown
                key={index}
                render={
                    <div className={`${prefixCls}-menu-bar-link-dropdown`}>
                        <Input
                            className={`${prefixCls}-menu-bar-link-input`}
                            placeholder={menuLocale.enterLinkAddress}
                            value={linkInputValue}
                            // a one-row editor: the adornments and showClear are set so global Input defaults cannot add them
                            addonAfter={null}
                            addonBefore={null}
                            insetLabel={null}
                            showClear={false}
                            size="small"
                            prefix={null}
                            suffix={null}
                            onChange={setLinkInputValue}
                            onEnterPress={handleConfirmLink}
                        />
                        <Button type="tertiary" aria-label={menuLocale.confirmLink} disabled={!linkInputValue.trim()} size="small" theme="borderless" icon={<IconCheckCircleStroked />} onClick={handleConfirmLink} />
                        <Button aria-label={menuLocale.removeLink} disabled={!editorState.isLink} size="small" theme="borderless" icon={<IconDeleteStroked />} onClick={handleUnsetLink} />
                    </div>
                }
                trigger="click"
                visible={linkDropdownVisible}
                onVisibleChange={(visible) => {
                    setLinkDropdownVisible(visible);
                    if (visible) {
                        const { range, href } = readLinkEditorOpenState(editor);
                        setLinkSelectionRange(range);
                        setLinkInputValue(href);
                    } else {
                        clearSelectionHighlight(editor);
                        setLinkSelectionRange(null);
                    }
                }}
            >
                <ConfigureButton aria-label={menuLocale.link} active={editorState.isLink} icon={<IconLink />} />
            </Dropdown>
        );
    };

    return <div className={className}>{getFileMenuItems(canUpload).map(renderItem)}</div>;
}

export const FileItem = React.memo(function FileItem({ editable = true, name, content, onContentChange, extensions = [], className, style, imgUploadProps, ...rest }: FileItemProps) {
    const defaultExtensions = useMemo<Extensions>(() => [...getFileEditorExtensions(), ImageUploadNode.configure(imgUploadProps)], [imgUploadProps]);

    // The upload node reads imgUploadProps only when the editor is created, so the image button must follow that same snapshot
    const [canUpload] = useState(() => canUploadImage(imgUploadProps));

    const allExtensions = useMemo(() => [...defaultExtensions, ...extensions], [defaultExtensions, extensions]);
    // Memoized: a new object per render would make useEditor call setOptions every render.
    const editorProps = useMemo(() => ({ attributes: getEditorAttributes(name) }), [name]);
    const editor = useEditor({
        extensions: allExtensions,
        editable: editable,
        editorProps,
        content: content,
        onUpdate: ({ editor, transaction }) => {
            // TrailingNode appends an empty paragraph on the first transaction, which is not an edit
            if (transaction.docChanged) {
                onContentChange?.(editor.getHTML());
            }
        },
    });

    // The equality check keeps the document and cursor when the owner only echoes back what onContentChange reported.
    useDidUpdate(content, (next) => {
        if (editor && next !== editor.getHTML()) {
            // not reported through onContentChange: the owner already knows what it passed
            editor.commands.setContent(next ?? '', { emitUpdate: false });
        }
    });
    useDidUpdate(editable, (next) => editor?.setEditable(next, false));

    if (!editor) {
        return null;
    }

    return (
        <div {...rest} className={clsx(prefixCls, { [className]: className })} style={style}>
            {editable && <MenuBar className={`${prefixCls}-menu-bar`} canUpload={canUpload} editor={editor} />}
            <EditorContent className={`${prefixCls}-editor`} editor={editor} />
        </div>
    );
});

export interface FileContentProps extends SideBarCollapseProps {
    files?: FileItemProps[];
    onExpand?: (e: React.MouseEvent, file: FileItemProps, mode: string) => void;
}

function FileContent({ activeKey, files = [], onExpand, style, className, onChange, ...rest }: FileContentProps) {
    return (
        <Collapse {...rest} className={clsx(collapseCls, `${collapseCls}-file`, { [className]: className })} style={style} activeKey={activeKey} clickHeaderToExpand={false} onChange={onChange}>
            {files.map((file) => {
                const { key, ...item } = file;
                return (
                    <Collapse.Panel key={key} header={<CollapseHeader content={file} mode="file" />} itemKey={key} extra={onExpand ? <CollapseExpandButton content={file} mode="file" onExpand={onExpand} /> : undefined}>
                        <FileItem {...item} editable={false} />
                    </Collapse.Panel>
                );
            })}
        </Collapse>
    );
}

export default React.memo(FileContent);
