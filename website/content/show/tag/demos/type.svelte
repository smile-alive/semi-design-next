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
        Semi: one component library for four frameworks
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
        Semi: one component library for four frameworks
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
        Semi: one component library for four frameworks
        {#snippet suffixIcon()}
            <IconSemiLogo />
        {/snippet}
    </Tag>
</Space>
