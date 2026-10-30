<script lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-svelte';

    const extraText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
    const items = [
        { value: '1', disabled: true },
        { value: '2', disabled: true },
        { value: '3', disabled: false },
        { value: '4', disabled: false },
    ];
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" direction="vertical" type="card" value={['1', '3']}>
    {#each items as item (item.value)}
        <Checkbox disabled={item.disabled} style="width: 280px" value={item.value}>
            单选框标题
            {#snippet extra()}{extraText}{/snippet}
        </Checkbox>
    {/each}
</CheckboxGroup>
