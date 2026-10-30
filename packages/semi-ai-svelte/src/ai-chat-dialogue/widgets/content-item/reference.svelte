<script lang="ts">
    import { cssClasses, getDialogueFileKind } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getFileSuffix, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { IconCode, IconExcel, IconPdf, IconSendMsgStroked, IconVideo, IconWord } from '@fibrae/semi-icons-svelte';
    import Image from '@fibrae/semi-ui-svelte/image/image.svelte';

    let { references }: { references: Reference[] } = $props();

    const prefixCls = cssClasses.PREFIX_REFERENCES;
    const referencePrefixCls = cssClasses.PREFIX_REFERENCE;

    // A thumbnail replaces the icon for images, so the image kind has none
    const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo };

    const items = $derived(
        references.map((reference) => {
            const kind = getDialogueFileKind(getFileSuffix(reference.name));
            return { reference, kind, Icon: kind && kind !== 'image' ? ICONS[kind] : undefined };
        })
    );
</script>

<div class={prefixCls}>
    <!-- Known limitation: background color and items per row are not specified by design yet -->
    {#each items as { reference, kind, Icon } (reference.id)}
        <div class={referencePrefixCls}>
            <IconSendMsgStroked />
            <span class="{referencePrefixCls}-content">
                {#if Icon}
                    <span class={[`${referencePrefixCls}-icon`, `${referencePrefixCls}-icon-${kind}`]}>
                        <Icon size="small" />
                    </span>
                {/if}
                {#if reference.url && reference.name && isImageFile(reference.name, reference.fileInstance?.type)}
                    <Image alt="" class="{referencePrefixCls}-img" height={16} src={reference.url} width={16} />
                {/if}
                <span class="{referencePrefixCls}-name">{reference.name || reference.content}</span>
            </span>
        </div>
    {/each}
</div>
