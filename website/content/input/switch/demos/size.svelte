<script lang="ts">
    import { Space, Switch } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Space style="display: block; margin-bottom: 10px">
        <Switch aria-label="小号开关" size="small" />
        <Switch aria-label="小号开关，已开启" checked size="small" />
        <Switch aria-label="小号开关，加载中" loading size="small" />
        <Switch aria-label="小号开关，已开启且加载中" checked loading size="small" />
    </Space>
    <Space style="display: block; margin-bottom: 10px">
        <Switch aria-label="默认开关" />
        <Switch aria-label="默认开关，已开启" checked />
        <Switch aria-label="默认开关，加载中" loading />
        <Switch aria-label="默认开关，已开启且加载中" checked loading />
    </Space>
    <Space>
        <Switch aria-label="大号开关" size="large" />
        <Switch aria-label="大号开关，已开启" checked size="large" />
        <Switch aria-label="大号开关，加载中" loading size="large" />
        <Switch aria-label="大号开关，已开启且加载中" checked loading size="large" />
    </Space>
</div>
