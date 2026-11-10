<script lang="ts">
    import { IconBell, IconHome } from '@fibrae/semi-icons-svelte';
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        title: 'Hi, Semi',
        content: 'ies dance dance dance',
        duration: 3,
    };
</script>

{#snippet bell()}<IconBell style="color: red" />{/snippet}
{#snippet home()}<IconHome />{/snippet}
{#snippet pinkHome()}<IconHome style="color: pink" />{/snippet}

<h5>默认的图标</h5>
<Button style="margin: 4px" type="primary" onclick={() => Notification.success(opts)}>Success</Button>
<Button style="margin: 4px" onclick={() => Notification.info(opts)}>Info</Button>
<Button style="margin: 4px" type="warning" onclick={() => Notification.warning(opts)}>Warning</Button>
<Button style="margin: 4px" type="danger" onclick={() => Notification.error(opts)}>Error</Button>
<h5>自定义图标</h5>
<Button aria-label="铃铛图标通知" style="margin-inline-end: 5px" onclick={() => Notification.info({ ...opts, icon: bell })}>
    {#snippet icon()}
        <IconBell />
    {/snippet}
</Button>
<Button aria-label="主页图标通知" style="margin-inline-end: 5px" onclick={() => Notification.info({ ...opts, icon: home })}>
    {#snippet icon()}
        <IconHome />
    {/snippet}
</Button>
<Button aria-label="粉色主页图标通知" onclick={() => Notification.info({ ...opts, icon: pinkHome })}>
    {#snippet icon()}
        <IconHome />
    {/snippet}
</Button>
