import { For, Show, createSignal, getOwner, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { type ChainedCommands, Editor, type Extensions } from '@tiptap/core';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { type Level, type TextRange, canUploadImage, clearSelectionHighlight, confirmLink, getEditorAttributes, getFileEditorExtensions, readFileMenuState, readLinkEditorOpenState } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
import {
    IconAlignCenter,
    IconAlignJustify,
    IconAlignLeft,
    IconAlignRight,
    IconBold,
    IconCheckCircleStroked,
    IconCode,
    IconDeleteStroked,
    IconH1,
    IconH2,
    IconH3,
    IconH4,
    IconH5,
    IconH6,
    IconHn,
    IconImage,
    IconItalic,
    IconLink,
    IconList,
    IconMinus,
    IconOrderedList,
    IconQuote,
    IconRedo,
    IconStrikeThrough,
    IconTerminal,
    IconText,
    IconUndo,
} from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import useWatch from '@fibrae/semi-ui-solid/_base/use-watch';
import Button, { type ButtonProps } from '@fibrae/semi-ui-solid/button/index';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
import Divider from '@fibrae/semi-ui-solid/divider/index';
import Dropdown from '@fibrae/semi-ui-solid/dropdown/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Input from '@fibrae/semi-ui-solid/input/index';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import type { SideBarCollapseProps } from '../interface';
import { CollapseExpandButton, CollapseHeader } from './code';
import { type ImageUploadNodeOptions, createImageUploadNode } from './image-slot';

const collapseCls = cssClasses.COLLAPSE;
const prefixCls = cssClasses.FILE;

export interface FileItemProps extends ElementProps<'div'> {
    /** Identifies the item's panel; a new key remounts the Sidebar detail */
    key?: string;
    name?: string;
    editable?: boolean;
    /** HTML; a later value replaces the document without calling onContentChange */
    content?: string;
    onContentChange?: (content: string) => void;
    /** Appended to the built-in extensions; read once, when the editor is created */
    extensions?: Extensions;
    /** Read once, when the editor is created */
    imgUploadProps?: ImageUploadNodeOptions;
}

export interface FileContentProps extends SideBarCollapseProps {
    files?: FileItemProps[];
    onExpand?: (e: MouseEvent, file: FileItemProps, mode: string) => void;
}

const headings = [IconH1, IconH2, IconH3, IconH4, IconH5, IconH6].map((Icon, index) => ({ Icon, level: (index + 1) as Level }));

interface MenuButtonProps extends ButtonProps {
    active?: boolean;
}

function MenuButton(props: MenuButtonProps) {
    const [local, rest] = splitProps(props, ['active', 'class']);

    return <Button {...rest} type="tertiary" class={clsx(`${prefixCls}-menu-bar-btn`, { [`${prefixCls}-menu-bar-btn-active`]: local.active }, local.class)} theme="borderless" />;
}

function MenuBar(props: { editor: Editor; canUpload: boolean }) {
    const locale = useLocale('Sidebar');

    const [linkVisible, setLinkVisible] = createSignal(false);
    const [linkInputValue, setLinkInputValue] = createSignal('');
    let linkSelectionRange: TextRange | null = null;

    // FileItem keeps one editor for the bar's life
    const editor = untrack(() => props.editor);

    const [state, setState] = createSignal(readFileMenuState(editor));

    const text = () => locale().locale;

    const update = () => setState(readFileMenuState(editor));

    const run = (command: (chain: ChainedCommands) => ChainedCommands) => command(editor.chain().focus()).run();

    const closeLink = () => {
        setLinkVisible(false);
        linkSelectionRange = null;
    };

    const handleConfirmLink = () => {
        if (!confirmLink(editor, linkInputValue().trim(), linkSelectionRange)) {
            return;
        }
        Toast.success(text().linkAddSuccess);
        closeLink();
    };

    const handleUnsetLink = () => {
        clearSelectionHighlight(editor);
        run((chain) => chain.unsetLink());
        Toast.success(text().linkRemoveSuccess);
        closeLink();
    };

    const handleLinkVisibleChange = (visible: boolean) => {
        setLinkVisible(visible);
        if (visible) {
            const { range, href } = readLinkEditorOpenState(editor);
            linkSelectionRange = range;
            setLinkInputValue(href);
        } else {
            clearSelectionHighlight(editor);
            linkSelectionRange = null;
        }
    };

    // the editor is not reactive: its transactions drive the bar
    editor.on('transaction', update);

    onCleanup(() => editor.off('transaction', update));

    // Dropdown triggers take getTriggerProps so aria-haspopup and aria-expanded land on the button itself
    return (
        <div class={`${prefixCls}-menu-bar`}>
            <MenuButton aria-label={text().undo} disabled={!state().canUndo} icon={<IconUndo />} onClick={() => run((chain) => chain.undo())} />
            <MenuButton aria-label={text().redo} disabled={!state().canRedo} icon={<IconRedo />} onClick={() => run((chain) => chain.redo())} />
            <Divider layout="vertical" />
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <For each={headings}>
                            {({ Icon, level }) => (
                                <Dropdown.Item
                                    class={clsx(`${prefixCls}-menu-bar-dropdown-item`, { [`${prefixCls}-menu-bar-dropdown-item-active`]: state().headingLevel === level })}
                                    aria-label={text().headingLevel.replace('${level}', String(level))}
                                    active={state().headingLevel === level}
                                    onClick={() => run((chain) => chain.toggleHeading({ level }))}
                                >
                                    <Icon />
                                </Dropdown.Item>
                            )}
                        </For>
                    </Dropdown.Menu>
                }
            >
                {(getTriggerProps) => <MenuButton {...getTriggerProps()} aria-label={text().heading} active={state().isHeading} icon={<IconHn />} />}
            </Dropdown>
            <MenuButton aria-label={text().paragraph} aria-pressed={state().isParagraph} active={state().isParagraph} icon={<IconText />} onClick={() => run((chain) => chain.setParagraph())} />
            <MenuButton aria-label={text().bulletList} aria-pressed={state().isBulletList} active={state().isBulletList} icon={<IconList />} onClick={() => run((chain) => chain.toggleBulletList())} />
            <MenuButton aria-label={text().orderedList} aria-pressed={state().isOrderedList} active={state().isOrderedList} icon={<IconOrderedList />} onClick={() => run((chain) => chain.toggleOrderedList())} />
            <MenuButton aria-label={text().blockquote} aria-pressed={state().isBlockquote} active={state().isBlockquote} icon={<IconQuote />} onClick={() => run((chain) => chain.toggleBlockquote())} />
            <MenuButton aria-label={text().codeBlock} aria-pressed={state().isCodeBlock} active={state().isCodeBlock} icon={<IconTerminal />} onClick={() => run((chain) => chain.toggleCodeBlock())} />
            <MenuButton aria-label={text().horizontalRule} icon={<IconMinus />} onClick={() => run((chain) => chain.setHorizontalRule())} />
            <Divider layout="vertical" />
            <MenuButton aria-label={text().alignLeft} aria-pressed={state().isAlignLeft} active={state().isAlignLeft} icon={<IconAlignLeft />} onClick={() => run((chain) => chain.setTextAlign('left'))} />
            <MenuButton aria-label={text().alignCenter} aria-pressed={state().isAlignCenter} active={state().isAlignCenter} icon={<IconAlignCenter />} onClick={() => run((chain) => chain.setTextAlign('center'))} />
            <MenuButton aria-label={text().alignRight} aria-pressed={state().isAlignRight} active={state().isAlignRight} icon={<IconAlignRight />} onClick={() => run((chain) => chain.setTextAlign('right'))} />
            <MenuButton aria-label={text().alignJustify} aria-pressed={state().isAlignJustify} active={state().isAlignJustify} icon={<IconAlignJustify />} onClick={() => run((chain) => chain.setTextAlign('justify'))} />
            <Divider layout="vertical" />
            <MenuButton aria-label={text().bold} aria-pressed={state().isBold} active={state().isBold} icon={<IconBold />} onClick={() => run((chain) => chain.toggleBold())} />
            <MenuButton aria-label={text().italic} aria-pressed={state().isItalic} disabled={!state().canItalic} active={state().isItalic} icon={<IconItalic />} onClick={() => run((chain) => chain.toggleItalic())} />
            <MenuButton aria-label={text().strike} aria-pressed={state().isStrike} disabled={!state().canStrike} active={state().isStrike} icon={<IconStrikeThrough />} onClick={() => run((chain) => chain.toggleStrike())} />
            <MenuButton aria-label={text().code} aria-pressed={state().isCode} disabled={!state().canCode} active={state().isCode} icon={<IconCode />} onClick={() => run((chain) => chain.toggleCode())} />
            <Dropdown
                render={
                    <div class={`${prefixCls}-menu-bar-link-dropdown`}>
                        <Input
                            class={`${prefixCls}-menu-bar-link-input`}
                            placeholder={text().enterLinkAddress}
                            value={linkInputValue()}
                            // a one-row editor: the adornments and showClear are set so global Input defaults cannot add them
                            addonAfter={null}
                            addonBefore={null}
                            insetLabel={null}
                            showClear={false}
                            size="small"
                            prefix={null}
                            suffix={null}
                            onChange={(value) => setLinkInputValue(value)}
                            onEnterPress={handleConfirmLink}
                        />
                        <Button type="tertiary" aria-label={text().confirmLink} disabled={!linkInputValue().trim()} size="small" theme="borderless" icon={<IconCheckCircleStroked />} onClick={handleConfirmLink} />
                        <Button aria-label={text().removeLink} disabled={!state().isLink} size="small" theme="borderless" icon={<IconDeleteStroked />} onClick={handleUnsetLink} />
                    </div>
                }
                trigger="click"
                visible={linkVisible()}
                onVisibleChange={handleLinkVisibleChange}
            >
                {(getTriggerProps) => <MenuButton {...getTriggerProps()} aria-label={text().link} active={state().isLink} icon={<IconLink />} />}
            </Dropdown>
            <Show when={props.canUpload}>
                <Divider layout="vertical" />
                <MenuButton aria-label={text().image} disabled={!state().canInsertImage} icon={<IconImage />} onClick={() => run((chain) => chain.insertContent({ type: 'imageUpload' }))} />
            </Show>
        </div>
    );
}

const fileItemDefaults = { editable: true } satisfies Partial<FileItemProps>;

export function FileItem(rawProps: FileItemProps) {
    const props = mergeProps(fileItemDefaults, rawProps);
    const [local, rest] = splitProps(props, ['key', 'editable', 'name', 'content', 'onContentChange', 'extensions', 'class', 'imgUploadProps']);

    // Created on mount: tiptap parses the content with the DOM, which a server render does not have. The effects
    // below apply later content, editable and name once the editor exists.
    const [editor, setEditor] = createSignal<Editor>();
    let editorRoot!: HTMLDivElement;

    // shortcut: extensions and imgUploadProps are read once, when the editor is created (tiptap does not swap the
    // extensions of a live editor); remount the item to apply new ones (Sidebar does so for a new detailContent key)
    // The image button follows the same snapshot as the upload node, so it never offers an upload without a target
    const canUpload = untrack(() => canUploadImage(local.imgUploadProps));
    const owner = getOwner();

    // The equality check keeps the document and cursor when the owner only echoes back what onContentChange reported.
    useWatch(
        () => local.content,
        (next) => {
            const current = editor();
            if (current && next !== current.getHTML()) {
                // not reported through onContentChange: the owner already knows what it passed
                current.commands.setContent(next ?? '', { emitUpdate: false });
            }
        }
    );

    useWatch(
        () => local.editable,
        (next) => editor()?.setEditable(next, false)
    );

    useWatch(
        () => local.name,
        (name) => editor()?.setOptions({ editorProps: { attributes: getEditorAttributes(name) } })
    );

    onMount(() => {
        const created = untrack(
            () =>
                new Editor({
                    element: editorRoot,
                    extensions: [...getFileEditorExtensions(), createImageUploadNode(owner, local.imgUploadProps), ...(local.extensions ?? [])],
                    editable: local.editable,
                    editorProps: { attributes: getEditorAttributes(local.name) },
                    content: local.content,
                    onUpdate: ({ editor: current, transaction }) => {
                        // TrailingNode appends an empty paragraph on the first transaction, which is not an edit
                        if (transaction.docChanged) {
                            local.onContentChange?.(current.getHTML());
                        }
                    },
                })
        );
        setEditor(created);
        onCleanup(() => created.destroy());
    });

    return (
        <div {...rest} class={clsx(prefixCls, local.class)}>
            <Show when={local.editable ? editor() : undefined} keyed>
                {(current) => <MenuBar canUpload={canUpload} editor={current} />}
            </Show>
            <div ref={(node) => (editorRoot = node)} class={`${prefixCls}-editor`} />
        </div>
    );
}

export default function FileContent(props: FileContentProps) {
    const [local, rest] = splitProps(props, ['activeKey', 'files', 'onExpand', 'class', 'onChange']);

    return (
        <Collapse {...rest} class={clsx(collapseCls, `${collapseCls}-file`, local.class)} activeKey={local.activeKey} clickHeaderToExpand={false} onChange={local.onChange}>
            <For each={local.files}>
                {(file) => (
                    <Collapse.Panel header={<CollapseHeader content={file} mode="file" />} itemKey={file.key as string} extra={local.onExpand ? <CollapseExpandButton content={file} mode="file" onExpand={local.onExpand} /> : undefined}>
                        <FileItem {...file} editable={false} />
                    </Collapse.Panel>
                )}
            </For>
        </Collapse>
    );
}
