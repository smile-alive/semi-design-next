<script lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import { TagInput } from '@fibrae/semi-ui-svelte';
</script>

<TagInput>
    {#snippet prefix()}
        <IconVigoLogo />
    {/snippet}
</TagInput>
<br />
<br />
<TagInput>
    {#snippet prefix()}Prefix{/snippet}
</TagInput>
<br />
<br />
<TagInput>
    {#snippet suffix()}
        <IconGift />
    {/snippet}
</TagInput>
<br />
<br />
<TagInput>
    {#snippet suffix()}Suffix{/snippet}
</TagInput>
