<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconBriefStroked } from '@fibrae/semi-icons-svelte';

    let { url, name, size, type }: { url?: string; name?: string; size?: string; type?: string } = $props();

    const { PREFIX_ATTACHMENT } = cssClasses;
</script>

<a class="{PREFIX_ATTACHMENT}-file" href={url} rel="noopener noreferrer" target="_blank">
    <IconBriefStroked class="{PREFIX_ATTACHMENT}-file-icon" size="extra-large" />
    <div class="{PREFIX_ATTACHMENT}-file-info">
        <span class="{PREFIX_ATTACHMENT}-file-title">{name}</span>
        <span class="{PREFIX_ATTACHMENT}-file-metadata"><span class="{PREFIX_ATTACHMENT}-file-type">{type}</span>{type ? ' · ' : ''}{size}</span>
    </div>
</a>
