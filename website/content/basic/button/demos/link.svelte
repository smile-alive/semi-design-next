<script lang="ts">
    import { IconLink } from '@fibrae/semi-icons-svelte';
    import { Typography } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Typography.Text link={{ href: 'https://semi.design/' }}>链接文本</Typography.Text>
    <br />
    <br />
    <Typography.Text link={{ href: 'https://semi.design/' }}>打开网站</Typography.Text>
    <br />
    <br />
    <Typography.Text link underline>
        {#snippet icon()}
            <IconLink />
        {/snippet}
        带下划线的网页链接
    </Typography.Text>
</div>
