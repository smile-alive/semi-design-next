<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Image, TypographyText, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const steps: UserGuideStepItem[] = [
        { title: '欢迎使用 Semi DSM!', position: 'bottom' },
        {
            title: '高可用的色盘',
            description: '选取主色后，我们的颜色算法会为你生成一套高可用的色盘',
            position: 'bottom',
        },
        { title: '自由定制', description: '开始定制属于你的设计系统吧！', position: 'bottom' },
    ];
    const covers = ['/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];
</script>

<template>
    <div>
        <Button @click="visible = true">开始引导</Button>
        <UserGuide v-model:visible="visible" mask mode="modal" :steps="steps" @change="(current) => console.log('当前引导步骤', current)" @finish="console.log('引导完成')" @next="console.log('下一步引导')" @prev="console.log('上一步引导')" @skip="console.log('跳过引导')">
            <template #description="{ index }">
                <div v-if="index === 0">你可以从已发布的主题出发，或者选择<TypographyText strong>立即创造</TypographyText>来创造一个新的主题</div>
            </template>
            <template #cover="{ index }">
                <Image height="100%" :src="covers[index]" width="600px" />
            </template>
        </UserGuide>
    </div>
</template>
