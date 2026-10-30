<script lang="ts">
    import { TypographyNumeral } from '@fibrae/semi-ui-svelte';

    const parserTCH = (oldVal: string) => {
        return oldVal
            .split(' ')
            .map((item) => (Number(item) ? `${item.replace(/(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')}+` : item))
            .join(' ');
    };

    const infos = [
        { type: 'Stars', min: '7100' },
        { type: 'Fork', min: '560' },
        { type: 'Downloads', min: '5000000' },
        { type: 'Contributors', min: '100' },
    ];
</script>

<div>
    <TypographyNumeral component="div" parser={parserTCH}>
        Semi Design 重视我们的用户，加入并助力我们不断完善
        {#each infos as item (item.min)}
            <p>
                {item.type}：<b style="color: var(--semi-violet-5)">{item.min}</b>
            </p>
        {/each}
    </TypographyNumeral>
    <br />
    <TypographyNumeral link={{ href: 'https://semi.design', target: '_blank' }} parser={parserTCH}>现已服务 {1e5} 用户，前往官网 &gt;&gt;</TypographyNumeral>
</div>
