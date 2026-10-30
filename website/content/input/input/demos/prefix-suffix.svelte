<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { Input, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<Input aria-label="Search" showClear>
    {#snippet prefix()}
        <IconSearch />
    {/snippet}
</Input>
<br />
<br />
<Input aria-label="Input with text prefix" showClear>
    {#snippet prefix()}Prefix{/snippet}
</Input>
<br />
<br />
<Input aria-label="Search" showClear>
    {#snippet suffix()}
        <IconSearch />
    {/snippet}
</Input>
<br />
<br />
<Input aria-label="Input with text suffix" showClear>
    {#snippet suffix()}
        <TypographyText strong style="margin-inline-end: 8px" type="secondary">Suffix</TypographyText>
    {/snippet}
</Input>
