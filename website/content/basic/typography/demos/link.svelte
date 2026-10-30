<script lang="ts">
    import { IconLink } from '@fibrae/semi-icons-svelte';
    import { TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TypographyText link={{ href: 'https://semi.design/' }}>链接文本</TypographyText>
    <br />
    <br />
    <TypographyText link={{ href: 'https://semi.design/' }}>打开网站</TypographyText>
    <br />
    <br />
    <TypographyText link underline>
        {#snippet icon()}
            <IconLink />
        {/snippet}
        带下划线的网页链接
    </TypographyText>
</div>
