<script setup lang="ts">
    import { Typography } from '@fibrae/semi-ui-vue';

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

<template>
    <div>
        <Typography.Numeral component="div" :parser="parserTCH">
            Semi Design 重视我们的用户，加入并助力我们不断完善
            <p v-for="item in infos" :key="item.min">
                {{ item.type }}：<b style="color: var(--semi-violet-5)">{{ item.min }}</b>
            </p>
        </Typography.Numeral>
        <br />
        <Typography.Numeral :link="{ href: 'https://semi-design-next.pages.dev/', target: '_blank' }" :parser="parserTCH"> 共计 {{ 1e5 }} 条数据，前往官网 &gt;&gt; </Typography.Numeral>
    </div>
</template>
