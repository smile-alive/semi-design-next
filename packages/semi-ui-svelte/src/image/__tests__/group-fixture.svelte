<script lang="ts">
    import Image from '../image.svelte';
    import type { ImageProps, MenuProps, PreviewProps } from '../interface';
    import ImagePreview from '../preview.svelte';

    // `images` are the thumbnails in the group; `props.src` is the group's list, which they open at
    let { store }: { store: { props: PreviewProps; images: ImageProps[]; snippets: string[] } } = $props();

    const on = (name: string) => store.snippets.includes(name);
</script>

{#snippet title({ title: text, index }: { title: string | undefined; index: number })}<b class="custom-title">{index}:{text}</b>{/snippet}
{#snippet closeIcon()}<i class="custom-close">x</i>{/snippet}
{#snippet leftIcon({ index }: { index: number })}<i class="custom-left">L{index}</i>{/snippet}
{#snippet rightIcon({ index }: { index: number })}<i class="custom-right">R{index}</i>{/snippet}
{#snippet previewMenu({ curPage, totalNum, menuItems }: MenuProps)}
    <div class="custom-menu">{curPage}/{totalNum}{@render menuItems()}</div>
{/snippet}

<ImagePreview {...store.props} closeIcon={on('closeIcon') ? closeIcon : undefined} leftIcon={on('leftIcon') ? leftIcon : undefined} previewMenu={on('previewMenu') ? previewMenu : undefined} rightIcon={on('rightIcon') ? rightIcon : undefined} title={on('title') ? title : undefined}>
    {#each store.images as image (image.src)}
        <Image {...image} />
    {/each}
</ImagePreview>
