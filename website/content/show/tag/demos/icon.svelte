<script lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { Space, Tag } from '@fibrae/semi-ui-svelte';
</script>

<Space>
    <Tag color="light-blue" shape="circle" size="large">
        {#snippet prefixIcon()}
            <IconGithubLogo />
        {/snippet}
        Semi Design
    </Tag>
    <Tag color="cyan" shape="circle" size="large">
        D2C: figma to code in one click
        {#snippet suffixIcon()}
            <IconSemiLogo />
        {/snippet}
    </Tag>
</Space>
