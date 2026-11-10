<script lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-svelte';
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" direction="vertical" type="card" value={['1', '3']}>
    <Checkbox disabled style="width: 280px" value="1">
        单选框标题
        {#snippet extra()}Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用{/snippet}
    </Checkbox>
    <Checkbox disabled style="width: 280px" value="2">
        单选框标题
        {#snippet extra()}Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用{/snippet}
    </Checkbox>
    <Checkbox style="width: 280px" value="3">
        单选框标题
        {#snippet extra()}Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用{/snippet}
    </Checkbox>
    <Checkbox style="width: 280px" value="4">
        单选框标题
        {#snippet extra()}Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用{/snippet}
    </Checkbox>
</CheckboxGroup>
