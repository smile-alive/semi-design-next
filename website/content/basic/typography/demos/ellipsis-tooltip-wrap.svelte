<script lang="ts">
    import { TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TypographyText ellipsis={{ showTooltip: true }} style="width: 150px">
        {#snippet ellipsisContent()}架构|Semi-inf|graph.cheet.relation{/snippet}
        有问题的超长文本发生截断时可按需进行自定义配置
    </TypographyText>
    <br />
    <TypographyText ellipsis={{ showTooltip: { opts: { class: 'components-typography-demo' } } }} style="width: 150px">
        {#snippet ellipsisContent()}架构|Semi-inf|graph.cheet.relation{/snippet}
        覆盖类名超长文本发生截断时可使用类名覆盖进行自定义配置
    </TypographyText>
    <br />
    <TypographyText ellipsis={{ showTooltip: { opts: { style: 'word-break: break-all' } } }} style="width: 150px">
        {#snippet ellipsisContent()}架构|Semi-inf|graph.cheet.relation{/snippet}
        覆盖style超长文本发生截断时可使用style进行自定义配置
    </TypographyText>
</div>
