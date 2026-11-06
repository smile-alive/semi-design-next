<script lang="ts">
    import { ConfigConsumer, ConfigProvider, Typography } from '@fibrae/semi-ui-svelte';
</script>

<ConfigProvider timeZone="GMT+08:00">
    <ConfigConsumer>
        {#snippet children(value)}
            <Typography.Text ellipsis={{ showTooltip: { opts: { style: 'min-width: 1200px' } } }} style="width: 600px">
                {JSON.stringify(value)}
            </Typography.Text>
        {/snippet}
    </ConfigConsumer>
</ConfigProvider>
