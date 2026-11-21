<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses, type ImagePreviewPart } from '@fibrae/semi-foundation/components/image/constants';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import useLocale from '../../locale/use-locale.svelte.js';
    import type { ImagePreviewTitleSnippetProps } from '../interface.js';

    interface Props {
        closable: boolean;
        title?: string;
        /** id of the title section, which names the preview dialog */
        titleId: string;
        hidden: boolean;
        index: number;
        classNames?: Partial<Record<ImagePreviewPart, ClassValue>>;
        styles?: Partial<Record<ImagePreviewPart, string>>;
        titleSnippet?: Snippet<[ImagePreviewTitleSnippetProps]>;
        closeIcon?: Snippet;
        onClose: (event: MouseEvent) => void;
    }

    let { closable, title, titleId, hidden, index, classNames, styles, titleSnippet, closeIcon, onClose }: Props = $props();

    const locale = useLocale('Image');

    let root = $state.raw<HTMLElement | null>(null);

    const cls = `${cssClasses.PREFIX}-preview-header`;

    export function getRoot() {
        return root;
    }
</script>

<section bind:this={root} class={[cls, { [`${cssClasses.PREFIX}-preview-hide`]: hidden }, classNames?.header]} style={styles?.header}>
    <section class={[`${cls}-title`, classNames?.title]} id={titleId} style={styles?.title}>
        {#if titleSnippet}
            {@render titleSnippet({ title, index })}
        {:else}
            {title}
        {/if}
    </section>
    {#if closable}
        <button aria-label={locale().locale.close} class={[`${cls}-close`, classNames?.close]} style={styles?.close} type="button" onclick={onClose}>
            {#if closeIcon}
                {@render closeIcon()}
            {:else}
                <IconClose />
            {/if}
        </button>
    {/if}
</section>
