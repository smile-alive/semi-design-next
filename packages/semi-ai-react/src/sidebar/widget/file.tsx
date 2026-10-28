import React, { useMemo, useState } from 'react';
import type { Extensions } from '@tiptap/core';
import { type Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { type TextRange, canUploadImage, clearSelectionHighlight, confirmLink, getEditorAttributes, getFileEditorExtensions, readFileMenuState, readLinkEditorOpenState } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
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
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
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
        clearSelectionHighlight(editor);
        editor.chain().focus().unsetLink().run();
        Toast.success(menuLocale.linkRemoveSuccess);
        setLinkDropdownVisible(false);
        setLinkSelectionRange(null);
    };

    const handleImageAdd = () => editor.chain().focus().insertContent({ type: 'imageUpload' }).run();

    return (
        <div className={className}>
            <ConfigureButton aria-label={menuLocale.undo} disabled={!editorState.canUndo} icon={<IconUndo />} onClick={() => editor.chain().focus().undo().run()} />
            <ConfigureButton aria-label={menuLocale.redo} disabled={!editorState.canRedo} icon={<IconRedo />} onClick={() => editor.chain().focus().redo().run()} />
            <Divider layout="vertical" />
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '1')} active={editorState.headingLevel === 1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                            <IconH1 />
                        </ConfigureDropdownItem>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '2')} active={editorState.headingLevel === 2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                            <IconH2 />
                        </ConfigureDropdownItem>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '3')} active={editorState.headingLevel === 3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                            <IconH3 />
                        </ConfigureDropdownItem>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '4')} active={editorState.headingLevel === 4} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                            <IconH4 />
                        </ConfigureDropdownItem>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '5')} active={editorState.headingLevel === 5} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
                            <IconH5 />
                        </ConfigureDropdownItem>
                        <ConfigureDropdownItem aria-label={menuLocale.headingLevel.replace('${level}', '6')} active={editorState.headingLevel === 6} onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                            <IconH6 />
                        </ConfigureDropdownItem>
                    </Dropdown.Menu>
                }
            >
                <ConfigureButton aria-label={menuLocale.heading} active={editorState.isHeading} icon={<IconHn />} />
            </Dropdown>
            <ConfigureButton aria-label={menuLocale.paragraph} aria-pressed={editorState.isParagraph} active={editorState.isParagraph} icon={<IconText />} onClick={() => editor.chain().focus().setParagraph().run()} />
            <ConfigureButton aria-label={menuLocale.bulletList} aria-pressed={editorState.isBulletList} active={editorState.isBulletList} icon={<IconList />} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ConfigureButton aria-label={menuLocale.orderedList} aria-pressed={editorState.isOrderedList} active={editorState.isOrderedList} icon={<IconOrderedList />} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ConfigureButton aria-label={menuLocale.blockquote} aria-pressed={editorState.isBlockquote} active={editorState.isBlockquote} icon={<IconQuote />} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ConfigureButton aria-label={menuLocale.codeBlock} aria-pressed={editorState.isCodeBlock} active={editorState.isCodeBlock} icon={<IconTerminal />} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
            <ConfigureButton aria-label={menuLocale.horizontalRule} icon={<IconMinus />} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            <Divider layout="vertical" />
            <ConfigureButton aria-label={menuLocale.alignLeft} aria-pressed={editorState.isAlignLeft} active={editorState.isAlignLeft} icon={<IconAlignLeft />} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
            <ConfigureButton aria-label={menuLocale.alignCenter} aria-pressed={editorState.isAlignCenter} active={editorState.isAlignCenter} icon={<IconAlignCenter />} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
            <ConfigureButton aria-label={menuLocale.alignRight} aria-pressed={editorState.isAlignRight} active={editorState.isAlignRight} icon={<IconAlignRight />} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
            <ConfigureButton aria-label={menuLocale.alignJustify} aria-pressed={editorState.isAlignJustify} active={editorState.isAlignJustify} icon={<IconAlignJustify />} onClick={() => editor.chain().focus().setTextAlign('justify').run()} />
            <Divider layout="vertical" />
            <ConfigureButton aria-label={menuLocale.bold} aria-pressed={editorState.isBold} active={editorState.isBold} icon={<IconBold />} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ConfigureButton aria-label={menuLocale.italic} aria-pressed={editorState.isItalic} disabled={!editorState.canItalic} active={editorState.isItalic} icon={<IconItalic />} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ConfigureButton aria-label={menuLocale.strike} aria-pressed={editorState.isStrike} disabled={!editorState.canStrike} active={editorState.isStrike} icon={<IconStrikeThrough />} onClick={() => editor.chain().focus().toggleStrike().run()} />
            <ConfigureButton aria-label={menuLocale.code} aria-pressed={editorState.isCode} disabled={!editorState.canCode} active={editorState.isCode} icon={<IconCode />} onClick={() => editor.chain().focus().toggleCode().run()} />
            <Dropdown
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
            {canUpload && (
                <>
                    <Divider layout="vertical" />
                    <ConfigureButton aria-label={menuLocale.image} disabled={!editorState.canInsertImage} icon={<IconImage />} onClick={handleImageAdd} />
                </>
            )}
        </div>
    );
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
