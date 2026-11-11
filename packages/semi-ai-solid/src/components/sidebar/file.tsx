import { For, Show, createSignal, getOwner, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { type ChainedCommands, Editor, type Extensions } from '@tiptap/core';
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
import { formatLocale } from '@fibrae/semi-foundation/locale';
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
import type { ElementProps } from '@fibrae/semi-ui-solid/base';
import Button, { type ButtonProps } from '@fibrae/semi-ui-solid/button/index';
import Collapse from '@fibrae/semi-ui-solid/collapse/index';
import Divider from '@fibrae/semi-ui-solid/divider/index';
import Dropdown from '@fibrae/semi-ui-solid/dropdown/index';
import Input from '@fibrae/semi-ui-solid/input/index';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import { useWatch } from '@fibrae/semi-ui-solid/primitives/index';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import { CollapseExpandButton, CollapseHeader } from './code';
import { type ImageUploadNodeOptions, createImageUploadNode } from './image-slot';
import type { SideBarCollapseProps } from './interface';

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

const MENU_ICONS = {
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
} satisfies Record<FileMenuButtonKey, unknown>;

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
        unsetLink(editor);
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

    // Dropdown triggers take getTriggerProps so aria-haspopup and aria-expanded land on the button itself
    const renderItem = (item: FileMenuItem) => {
        if (item.type === 'divider') {
            return <Divider layout="vertical" />;
        }
        if (item.type === 'heading') {
            return (
                <Dropdown
                    render={
                        <Dropdown.Menu>
                            <For each={headings}>
                                {({ Icon, level }) => (
                                    <Dropdown.Item
                                        class={clsx(`${prefixCls}-menu-bar-dropdown-item`, { [`${prefixCls}-menu-bar-dropdown-item-active`]: state().headingLevel === level })}
                                        aria-label={formatLocale(text().headingLevel, { level })}
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
            );
        }
        if (item.type === 'button') {
            const Icon = MENU_ICONS[item.key];
            const active = () => (item.activeKey ? state()[item.activeKey] : undefined);
            return <MenuButton aria-label={text()[item.key]} aria-pressed={active()} active={active()} disabled={item.enabledKey !== undefined && !state()[item.enabledKey]} icon={<Icon />} onClick={() => run(item.command)} />;
        }
        return (
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
        );
    };

    onCleanup(() => editor.off('transaction', update));

    return (
        <div class={`${prefixCls}-menu-bar`}>
            <For each={getFileMenuItems(props.canUpload)}>{renderItem}</For>
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
                    <Collapse.Panel header={<CollapseHeader content={file} mode="file" />} itemKey={file.key!} extra={local.onExpand ? <CollapseExpandButton content={file} mode="file" onExpand={local.onExpand} /> : undefined}>
                        <FileItem {...file} editable={false} />
                    </Collapse.Panel>
                )}
            </For>
        </Collapse>
    );
}
