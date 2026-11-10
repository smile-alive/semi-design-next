<script lang="ts">
    import { ConfigConsumer, ConfigProvider } from '@fibrae/semi-ui-svelte';
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
</script>

{#snippet show(title: string)}
    <ConfigConsumer>
        {#snippet children(config)}
            <div style="margin: 8px">{title}：locale = {config.locale?.code ?? '未设置'}，timeZone = {String(config.timeZone)}，direction = {config.direction}</div>
        {/snippet}
    </ConfigConsumer>
{/snippet}

<ConfigProvider direction="ltr" locale={en_US} timeZone="Asia/Tokyo">
    {@render show('外层')}
    <ConfigProvider timeZone={8}>
        {@render show('内层只传 timeZone，其余继承外层')}
    </ConfigProvider>
</ConfigProvider>
