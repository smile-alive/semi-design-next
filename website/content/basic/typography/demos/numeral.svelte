<script lang="ts">
    import { TypographyNumeral } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TypographyNumeral component="div" precision={1}>
        <p>点赞量：1.6111e1 K</p>
    </TypographyNumeral>

    <p>播放量:<TypographyNumeral precision={1} rule="numbers">2.4444e2</TypographyNumeral>K</p>

    <TypographyNumeral component="div" precision={2} rule="percentages" style="margin-bottom: 12px">
        <p>好评率: 0.915</p>
    </TypographyNumeral>

    <TypographyNumeral rule="percentages" style="margin-bottom: 12px">这场比赛我的胜率是0.6，输的概率是0.4</TypographyNumeral>

    <TypographyNumeral component="div" precision={2} rule="bytes-decimal" truncate="floor">
        <p>已使用: 1000</p>
        <p>未使用: {1024 * 1000}</p>
    </TypographyNumeral>

    <TypographyNumeral component="div" precision={2} rule="bytes-binary" truncate="floor">
        <p>已使用: 1024</p>
        <p>未使用: {2e12}</p>
    </TypographyNumeral>
</div>
