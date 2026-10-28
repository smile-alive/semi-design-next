<script setup lang="ts">
    import { Typography } from '@fibrae/semi-ui-vue';

    const { Numeral } = Typography;
</script>

<template>
    <div>
        <Numeral component="div" :precision="1">
            <p>点赞量：1.6111e1 K</p>
        </Numeral>

        <p>播放量:<Numeral :precision="1" rule="numbers">2.4444e2</Numeral>K</p>

        <Numeral component="div" :precision="2" rule="percentages" style="margin-bottom: 12px">
            <p>好评率: 0.915</p>
        </Numeral>

        <Numeral rule="percentages" style="margin-bottom: 12px">这场比赛我的胜率是0.6，输的概率是0.4</Numeral>

        <Numeral component="div" :precision="2" rule="bytes-decimal" truncate="floor">
            <p>已使用: 1000</p>
            <p>未使用: {{ 1024 * 1000 }}</p>
        </Numeral>

        <Numeral component="div" :precision="2" rule="bytes-binary" truncate="floor">
            <p>已使用: 1024</p>
            <p>未使用: {{ 2e12 }}</p>
        </Numeral>
    </div>
</template>
