<script lang="ts">
    import { getAllContexts, untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { Editor } from '@tiptap/core';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { canUploadImage, getEditorAttributes, getFileEditorExtensions } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import { createImageUploadNode } from './image-slot.js';
    import type { FileItemProps } from './interface.js';
    import MenuBar from './menu-bar.svelte';

    let { name, content, editable = true, extensions = [], imgUploadProps, onContentChange, ...rest }: FileItemProps = $props();

    let editor = $state.raw<Editor>();

    // The content the document was last set to; an unchanged value must not overwrite the user's edits
    let appliedContent = untrack(() => content);

    // the slot views mount as separate roots; with these they read the same locale and config as this component
    const contexts = getAllContexts();
    const prefix = cssClasses.FILE;

    // The image button follows the same snapshot as the upload node, so it never offers an upload without a target
    const canUpload = untrack(() => canUploadImage(imgUploadProps));

    // shortcut: extensions and imgUploadProps are read once, when the editor is created (tiptap does not swap the
    // extensions of a live editor); remount the item with a new key to apply new ones
    // Untracked: a prop read here would make Svelte rerun the attachment, destroying the editor and its content
    const mountEditor: Attachment<HTMLDivElement> = (element) =>
        untrack(() => {
            const instance = new Editor({
                element,
                extensions: [...getFileEditorExtensions(), createImageUploadNode(contexts, imgUploadProps), ...extensions],
                editable,
                editorProps: { attributes: getEditorAttributes(name) },
                content,
                // tiptap's injected CSS is unlayered and would override `@layer semi`
                injectCSS: false,
                onUpdate: ({ editor: current, transaction }) => {
                    // TrailingNode appends an empty paragraph on the first transaction, which is not an edit
                    if (transaction.docChanged) {
                        onContentChange?.(current.getHTML());
                    }
                },
            });
            editor = instance;
            return () => {
                editor = undefined;
                instance.destroy();
            };
        });

    // The equality check keeps the document and cursor when the owner only echoes back what onContentChange reported.
    watch(
        () => content,
        (next) => {
            if (!editor || next === appliedContent) {
                return;
            }
            appliedContent = next;
            if (next !== editor.getHTML()) {
                // not reported through onContentChange: the owner already knows what it passed
                editor.commands.setContent(next ?? '', { emitUpdate: false });
            }
        }
    );

    watch(
        () => editable,
        (next) => editor?.setEditable(next, false)
    );

    watch(
        () => name,
        (next) => editor?.setOptions({ editorProps: { attributes: getEditorAttributes(next) } })
    );
</script>

<div {...rest} class={[prefix, rest.class]}>
    {#if editable && editor}
        <MenuBar {canUpload} {editor} />
    {/if}
    <div {@attach mountEditor} class={`${prefix}-editor`}></div>
</div>
