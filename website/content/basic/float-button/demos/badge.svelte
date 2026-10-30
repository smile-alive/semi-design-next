<script lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-svelte';
    import { FloatButton } from '@fibrae/semi-ui-svelte';
</script>

{#snippet icon()}
    <IconAIEditLevel1 />
{/snippet}

<span>带徽章：页面右下第二列</span>
<FloatButton aria-label="AI 编辑" badge={{ dot: true, type: 'danger' }} disabled {icon} style="bottom: 270px; inset-inline-end: 100px" />
<FloatButton aria-label="AI 编辑，999+" badge={{ count: 1000, overflowCount: 999 }} {icon} size="large" style="bottom: 210px; inset-inline-end: 100px" />
<FloatButton aria-label="AI 编辑" badge={{ dot: true }} colorful {icon} style="bottom: 170px; inset-inline-end: 100px" />
<FloatButton aria-label="AI 编辑，VIP" badge={{ count: 'VIP', type: 'danger' }} colorful {icon} size="large" style="bottom: 110px; inset-inline-end: 100px" />
