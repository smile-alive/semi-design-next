<script setup lang="ts">
    import { Typography } from '@fibrae/semi-ui-vue';

    const { Paragraph, Text } = Typography;
</script>

<template>
    <div>
        <Text>正常文本</Text>
        <Paragraph spacing="extended"> Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。 </Paragraph>
        <br />
        <Text size="small">小文本</Text>
        <Paragraph size="small"> Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。 </Paragraph>
        <br />
        <Text size="small">
            这是一段文本，样式为 small
            <Text link size="inherit">这是一段链接，设置 size 为 inherit 继承外部样式设置</Text>
        </Text>
    </div>
</template>
