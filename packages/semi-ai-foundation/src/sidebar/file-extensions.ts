import { type Editor, type Extensions, Mark, Node, mergeAttributes } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { BulletList, ListItem, ListKeymap, OrderedList } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Text } from '@tiptap/extension-text';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Dropcursor, Gapcursor, TrailingNode, UndoRedo } from '@tiptap/extensions';

// Frameworks call ChainedCommands (toggleBold, setLink, ...) typed by each extension's augmentation of @tiptap/core;
// re-exporting a type keeps that augmentation in the generated declarations they read
export type { BlockquoteOptions } from '@tiptap/extension-blockquote';
export type { BoldOptions } from '@tiptap/extension-bold';
export type { CodeOptions } from '@tiptap/extension-code';
export type { CodeBlockOptions } from '@tiptap/extension-code-block';
export type { Level } from '@tiptap/extension-heading';
export type { HorizontalRuleOptions } from '@tiptap/extension-horizontal-rule';
export type { ItalicOptions } from '@tiptap/extension-italic';
export type { LinkOptions } from '@tiptap/extension-link';
export type { BulletListOptions, OrderedListOptions } from '@tiptap/extension-list';
export type { ParagraphOptions } from '@tiptap/extension-paragraph';
export type { StrikeOptions } from '@tiptap/extension-strike';
export type { TextAlignOptions } from '@tiptap/extension-text-align';

// Keeps the selection visible while the link input has focus and the editor hides its own
export const SelectionMark = Mark.create({
    name: 'selectionMark',
    inclusive: false,
    parseHTML() {
        return [{ tag: 'span.select' }];
    },
    renderHTML() {
        return ['span', { class: 'select' }, 0];
    },
});

export interface TextRange {
    from: number;
    to: number;
}

// The highlight is UI state: it must reach neither onContentChange nor the undo history
const chainWithoutRecord = (editor: Editor) => editor.chain().setMeta('preventUpdate', true).setMeta('addToHistory', false);

export function highlightSelection(editor: Editor) {
    chainWithoutRecord(editor).focus().setMark(SelectionMark.name).run();
}

/** Removes the highlight wherever it is: only one exists at a time, so no caller has to remember its range */
export function clearSelectionHighlight(editor: Editor) {
    chainWithoutRecord(editor)
        .command(({ tr, state }) => {
            tr.removeMark(0, tr.doc.content.size, state.schema.marks[SelectionMark.name]);
            return true;
        })
        .run();
}

export interface ImageUploadNodeBaseOptions {
    /** The node an uploaded image replaces the slot with */
    type: string;
    accept: string;
    limit: number;
    action?: string;
    HTMLAttributes: Record<string, unknown>;
}

/** The image upload slot's schema; each framework adds its own node view through `extend({ addNodeView })` */
export const ImageUploadNode = Node.create<ImageUploadNodeBaseOptions>({
    name: 'imageUpload',
    group: 'block',
    draggable: true,
    selectable: true,
    atom: true,

    addOptions() {
        return {
            type: 'image',
            accept: 'image/*',
            limit: 1,
            action: undefined,
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="image-upload"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'image-upload' }, HTMLAttributes)];
    },
});

/** The built-in extensions of the file editor; callers append their own ImageUploadNode, then the user's extensions */
export function getFileEditorExtensions(): Extensions {
    return [
        TextStyleKit,
        // Order decides which extension wins a shared shortcut: Mod-Shift-b is the blockquote, not bold
        Bold,
        Blockquote,
        BulletList,
        Code,
        CodeBlock,
        Document,
        Dropcursor,
        Gapcursor,
        HardBreak,
        Heading,
        UndoRedo,
        HorizontalRule,
        Italic,
        ListItem,
        ListKeymap,
        Link.configure({ openOnClick: false, enableClickSelection: true }),
        OrderedList,
        Paragraph,
        Strike,
        Text,
        TrailingNode,
        Image,
        SelectionMark,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ];
}

/** The image button is offered only when an upload can actually go somewhere */
export function canUploadImage(options?: { action?: string; customRequest?: unknown }) {
    return Boolean(options?.action || options?.customRequest);
}

export function getEditorAttributes(name?: string): Record<string, string> {
    return name ? { 'aria-label': name } : {};
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export interface FileMenuState {
    isBold: boolean;
    isItalic: boolean;
    canItalic: boolean;
    isStrike: boolean;
    canStrike: boolean;
    isCode: boolean;
    canCode: boolean;
    isParagraph: boolean;
    isHeading: boolean;
    headingLevel?: (typeof HEADING_LEVELS)[number];
    isBulletList: boolean;
    isOrderedList: boolean;
    isCodeBlock: boolean;
    isBlockquote: boolean;
    isLink: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isAlignLeft: boolean;
    isAlignCenter: boolean;
    isAlignRight: boolean;
    isAlignJustify: boolean;
    canInsertImage: boolean;
}

export function readFileMenuState(editor: Editor): FileMenuState {
    const can = () => editor.can().chain();
    return {
        isBold: editor.isActive('bold'),
        isItalic: editor.isActive('italic'),
        canItalic: can().toggleItalic().run(),
        isStrike: editor.isActive('strike'),
        canStrike: can().toggleStrike().run(),
        isCode: editor.isActive('code'),
        canCode: can().toggleCode().run(),
        isParagraph: editor.isActive('paragraph'),
        isHeading: editor.isActive('heading'),
        headingLevel: HEADING_LEVELS.find((level) => editor.isActive('heading', { level })),
        isBulletList: editor.isActive('bulletList'),
        isOrderedList: editor.isActive('orderedList'),
        isCodeBlock: editor.isActive('codeBlock'),
        isBlockquote: editor.isActive('blockquote'),
        isLink: editor.isActive('link'),
        canUndo: can().undo().run(),
        canRedo: can().redo().run(),
        isAlignLeft: editor.isActive({ textAlign: 'left' }),
        isAlignCenter: editor.isActive({ textAlign: 'center' }),
        isAlignRight: editor.isActive({ textAlign: 'right' }),
        isAlignJustify: editor.isActive({ textAlign: 'justify' }),
        canInsertImage: editor.can().insertContent({ type: 'imageUpload' }),
    };
}

/** Snapshots the selection the link will apply to, since the link input takes the editor's focus */
export function readLinkEditorOpenState(editor: Editor): { range: TextRange; href: string } {
    const { from, to } = editor.state.selection;
    if (from !== to) {
        highlightSelection(editor);
    }
    return { range: { from, to }, href: editor.getAttributes('link').href || '' };
}

/** Returns false, leaving the document untouched, for an empty href or one the Link extension rejects (a javascript: URL) */
export function confirmLink(editor: Editor, href: string, range: TextRange | null) {
    if (!href || !editor.can().setLink({ href })) {
        return false;
    }
    const { from, to } = range ?? editor.state.selection;
    clearSelectionHighlight(editor);
    const chain = editor.chain().focus();
    if (from !== to) {
        chain.setTextSelection({ from, to }).extendMarkRange('link').setLink({ href }).run();
    } else {
        chain
            .setTextSelection(from)
            .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
            .run();
    }
    return true;
}

export interface UploadedImage {
    editor: Editor;
    /** Undefined once the slot's node is gone (deleted, or the editor was destroyed) while the upload ran */
    pos?: number;
    nodeSize: number;
    type: string;
    response: any;
    name: string;
    getUploadImageSrc?: (response: any) => string;
}

/** Replaces the upload slot with the uploaded image */
export function insertUploadedImage({ editor, pos, nodeSize, type, response, name, getUploadImageSrc }: UploadedImage) {
    let src: string | undefined;
    if (getUploadImageSrc) {
        src = getUploadImageSrc(response);
    } else if (typeof response === 'string') {
        src = response;
    } else if (response?.src) {
        src = response.src;
    }
    if (pos === undefined) {
        return;
    }
    editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + nodeSize })
        .insertContentAt(pos, { type, attrs: { src, alt: name, title: name } })
        .run();
}
