<script setup lang="ts">
    import { Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;
</script>

<template>
    <div>
        <Text :ellipsis="{ showTooltip: true }" style="width: 150px">
            有问题的超长文本发生截断时可按需进行自定义配置
            <template #ellipsisContent>架构|Semi-inf|graph.cheet.relation</template>
        </Text>
        <br />
        <Text :ellipsis="{ showTooltip: { opts: { class: 'components-typography-demo' } } }" style="width: 150px">
            覆盖类名超长文本发生截断时可使用类名覆盖进行自定义配置
            <template #ellipsisContent>架构|Semi-inf|graph.cheet.relation</template>
        </Text>
        <br />
        <Text :ellipsis="{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }" style="width: 150px">
            覆盖style超长文本发生截断时可使用style进行自定义配置
            <template #ellipsisContent>架构|Semi-inf|graph.cheet.relation</template>
        </Text>
    </div>
</template>
