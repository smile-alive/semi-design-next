<script lang="ts">
    import { Space, Switch } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Space style="display: block; margin-bottom: 10px">
        <Switch aria-label="a switch for demo" size="small" />
        <Switch aria-label="a switch for demo" checked size="small" />
        <Switch aria-label="a switch for demo" loading size="small" />
        <Switch aria-label="a switch for demo" checked loading size="small" />
    </Space>
    <Space style="display: block; margin-bottom: 10px">
        <Switch aria-label="a switch for demo" />
        <Switch aria-label="a switch for demo" checked />
        <Switch aria-label="a switch for demo" loading />
        <Switch aria-label="a switch for demo" checked loading />
    </Space>
    <Space>
        <Switch aria-label="a switch for demo" size="large" />
        <Switch aria-label="a switch for demo" checked size="large" />
        <Switch aria-label="a switch for demo" loading size="large" />
        <Switch aria-label="a switch for demo" checked loading size="large" />
    </Space>
</div>
