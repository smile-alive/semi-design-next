<script lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-svelte';
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" direction="vertical" type="card" value={['1', '3']}>
    <Checkbox disabled style="width: 280px" value="1">
        单选框标题
        {#snippet extra()}Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统{/snippet}
    </Checkbox>
    <Checkbox disabled style="width: 280px" value="2">
        单选框标题
        {#snippet extra()}Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统{/snippet}
    </Checkbox>
    <Checkbox style="width: 280px" value="3">
        单选框标题
        {#snippet extra()}Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统{/snippet}
    </Checkbox>
    <Checkbox style="width: 280px" value="4">
        单选框标题
        {#snippet extra()}Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统{/snippet}
    </Checkbox>
</CheckboxGroup>
