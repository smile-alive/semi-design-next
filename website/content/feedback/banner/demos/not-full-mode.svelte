<script lang="ts">
    import { Banner, TypographyText } from '@fibrae/semi-ui-svelte';

    const types = ['info', 'warning', 'danger', 'success'] as const;
</script>

<div class="components-banner-demo" style="width: 640px">
    {#each types as type, index (type)}
        {#if index > 0}
            <br />
        {/if}
        <Banner bordered closeIcon={null} fullMode={false} icon={null} {type}>
            {#snippet title()}
                <div style="font-weight: 600; font-size: 14px; line-height: 20px">不知道 AppKey？</div>
            {/snippet}
            {#snippet description()}
                <div>
                    你可先联系对应的研发同学，确认是否已在
                    <TypographyText link={{ href: 'https://semi.design/' }}>应用云平台</TypographyText>
                    申请了应用，并填写对应的信息。
                </div>
            {/snippet}
        </Banner>
    {/each}
</div>
