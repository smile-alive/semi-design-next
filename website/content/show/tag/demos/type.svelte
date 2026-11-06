<script lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { Space, Tag } from '@fibrae/semi-ui-svelte';
</script>

<Space wrap>
    <Tag color="light-blue" shape="circle" size="large" type="light">
        {#snippet prefixIcon()}
            <IconGithubLogo />
        {/snippet}
        Semi Design Light Tag
    </Tag>
    <Tag color="cyan" shape="circle" size="large" type="light">
        D2C: figma to code in one click
        {#snippet suffixIcon()}
            <IconSemiLogo />
        {/snippet}
    </Tag>
    <Tag color="light-blue" shape="circle" size="large" type="ghost">
        {#snippet prefixIcon()}
            <IconGithubLogo />
        {/snippet}
        Semi Design Ghost Tag
    </Tag>
    <Tag color="cyan" shape="circle" size="large" type="ghost">
        D2C: figma to code in one click
        {#snippet suffixIcon()}
            <IconSemiLogo />
        {/snippet}
    </Tag>
    <Tag color="light-blue" shape="circle" size="large" type="solid">
        {#snippet prefixIcon()}
            <IconGithubLogo />
        {/snippet}
        Semi Design Solid Tag
    </Tag>
    <Tag color="cyan" shape="circle" size="large" type="solid">
        D2C: figma to code in one click
        {#snippet suffixIcon()}
            <IconSemiLogo />
        {/snippet}
    </Tag>
</Space>
