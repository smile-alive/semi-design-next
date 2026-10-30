<script lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-svelte';

    const extraText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<Checkbox aria-label="Checkbox 示例">
    Semi Design
    {#snippet extra()}{extraText}{/snippet}
</Checkbox>
<br />
<Checkbox aria-label="Checkbox 示例" style="width: 280px">
    Semi Design
    {#snippet extra()}{extraText}{/snippet}
</Checkbox>
