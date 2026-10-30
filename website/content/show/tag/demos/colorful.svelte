<script lang="ts">
    import { IconAIFilledLevel1, IconAIFilledLevel3 } from '@fibrae/semi-icons-svelte';
    import { Tag } from '@fibrae/semi-ui-svelte';

    const grid = 'display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 10px; width: fit-content';
</script>

{#snippet level1()}
    <IconAIFilledLevel1 size="small" />
{/snippet}
{#snippet level3()}
    <IconAIFilledLevel3 size="small" />
{/snippet}

<div style="display: flex; flex-direction: column; row-gap: 30px">
    <div style={grid}>
        <Tag colorful gradient prefixIcon={level1} shape="circle" type="solid">AI</Tag>
        <Tag colorful gradient prefixIcon={level3} shape="circle" type="light">AI</Tag>
        <Tag colorful gradient prefixIcon={level3} shape="circle" type="ghost">AI</Tag>
        <Tag colorful prefixIcon={level1} shape="circle" type="solid">AI</Tag>
        <Tag colorful prefixIcon={level1} shape="circle" type="light">AI</Tag>
        <Tag colorful prefixIcon={level1} shape="circle" type="ghost">AI</Tag>
    </div>
    <div style={grid}>
        <Tag colorful gradient prefixIcon={level1} type="solid">AI</Tag>
        <Tag colorful gradient prefixIcon={level3} type="light">AI</Tag>
        <Tag colorful gradient prefixIcon={level3} type="ghost">AI</Tag>
        <Tag colorful prefixIcon={level1} type="solid">AI</Tag>
        <Tag colorful prefixIcon={level1} type="light">AI</Tag>
        <Tag colorful prefixIcon={level1} type="ghost">AI</Tag>
    </div>
</div>
