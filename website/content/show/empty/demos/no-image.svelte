<script lang="ts">
    import { Empty, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<Empty title="暂未找到匹配的筛选结果">
    {#snippet description()}
        <span>
            <TypographyText>试试</TypographyText>
            <TypographyText link>重置筛选条件</TypographyText>
        </span>
    {/snippet}
</Empty>
