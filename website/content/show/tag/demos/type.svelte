<script lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { Space, Tag, type TagType } from '@fibrae/semi-ui-svelte';

    const types: [TagType, string][] = [
        ['light', 'Light'],
        ['ghost', 'Ghost'],
        ['solid', 'Solid'],
    ];
</script>

<Space wrap>
    {#each types as [type, label] (type)}
        <Tag color="light-blue" shape="circle" size="large" {type}>
            {#snippet prefixIcon()}
                <IconGithubLogo />
            {/snippet}
            Semi Design {label} Tag
        </Tag>
        <Tag color="cyan" shape="circle" size="large" {type}>
            D2C: figma to code in one click
            {#snippet suffixIcon()}
                <IconSemiLogo />
            {/snippet}
        </Tag>
    {/each}
</Space>
