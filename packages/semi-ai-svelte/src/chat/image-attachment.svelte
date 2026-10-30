<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Image from '@fibrae/semi-ui-svelte/image/image.svelte';

    let { src, alt, name }: { src?: string; alt?: string; name?: string } = $props();

    const locale = useLocale('Chat');

    const { PREFIX_ATTACHMENT } = cssClasses;
</script>

<!-- an alt (markdown) or file name (attachment) names the image better than the generic text -->
<Image alt={alt || name || locale().locale.image} class="{PREFIX_ATTACHMENT}-img" height={60} {src} width={60} />
