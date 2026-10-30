<script lang="ts">
    import Image from '../image.svelte';
    import type { ImageProps, MenuProps } from '../interface';

    // A snippet is passed only when its flag is on, so absence stays observable
    let { store }: { store: { props: ImageProps; snippets: string[] } } = $props();

    const on = (name: string) => store.snippets.includes(name);
</script>

{#snippet placeholder()}<span class="ph">loading</span>{/snippet}
{#snippet fallback()}<span class="fb">failed</span>{/snippet}
{#snippet title({ title: text, index }: { title: string | undefined; index: number })}<b class="custom-title">{index}:{text}</b>{/snippet}
{#snippet closeIcon()}<i class="custom-close">x</i>{/snippet}
{#snippet leftIcon({ index }: { index: number })}<i class="custom-left">L{index}</i>{/snippet}
{#snippet rightIcon({ index }: { index: number })}<i class="custom-right">R{index}</i>{/snippet}
{#snippet previewMenu({ curPage, totalNum, menuItems }: MenuProps)}
    <div class="custom-menu">{curPage}/{totalNum}{@render menuItems()}</div>
{/snippet}

<Image
    {...store.props}
    closeIcon={on('closeIcon') ? closeIcon : undefined}
    fallback={on('fallback') ? fallback : store.props.fallback}
    leftIcon={on('leftIcon') ? leftIcon : undefined}
    placeholder={on('placeholder') ? placeholder : undefined}
    previewMenu={on('previewMenu') ? previewMenu : undefined}
    rightIcon={on('rightIcon') ? rightIcon : undefined}
    title={on('title') ? title : undefined}
/>
