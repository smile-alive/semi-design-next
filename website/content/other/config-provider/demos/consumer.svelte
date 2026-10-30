<script lang="ts">
    import { ConfigConsumer, ConfigProvider, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<ConfigProvider timeZone="GMT+08:00">
    <ConfigConsumer>
        {#snippet children(value)}
            <TypographyText ellipsis={{ showTooltip: { opts: { style: 'min-width: 1200px' } } }} style="width: 600px">
                {JSON.stringify(value)}
            </TypographyText>
        {/snippet}
    </ConfigConsumer>
</ConfigProvider>
