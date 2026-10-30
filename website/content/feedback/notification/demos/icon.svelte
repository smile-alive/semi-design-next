<script lang="ts">
    import { IconToutiaoLogo, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        title: 'Hi, Bytedance',
        content: 'ies dance dance dance',
        duration: 3,
    };
</script>

{#snippet toutiao()}<IconToutiaoLogo style="color: red" />{/snippet}
{#snippet vigo()}<IconVigoLogo />{/snippet}
{#snippet pinkVigo()}<IconVigoLogo style="color: pink" />{/snippet}

<h5>默认的图标</h5>
<Button style="margin: 4px" type="primary" onclick={() => Notification.success(opts)}>Success</Button>
<Button style="margin: 4px" onclick={() => Notification.info(opts)}>Info</Button>
<Button style="margin: 4px" type="warning" onclick={() => Notification.warning(opts)}>Warning</Button>
<Button style="margin: 4px" type="danger" onclick={() => Notification.error(opts)}>Error</Button>
<h5>自定义图标</h5>
<Button aria-label="Toutiao 图标通知" style="margin-right: 5px" onclick={() => Notification.info({ ...opts, icon: toutiao })}>
    {#snippet icon()}
        <IconToutiaoLogo />
    {/snippet}
</Button>
<Button aria-label="Vigo 图标通知" style="margin-right: 5px" onclick={() => Notification.info({ ...opts, icon: vigo })}>
    {#snippet icon()}
        <IconVigoLogo />
    {/snippet}
</Button>
<Button aria-label="粉色 Vigo 图标通知" onclick={() => Notification.info({ ...opts, icon: pinkVigo })}>
    {#snippet icon()}
        <IconVigoLogo />
    {/snippet}
</Button>
