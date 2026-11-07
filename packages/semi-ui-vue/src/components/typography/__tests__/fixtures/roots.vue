<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Numeral from '../../numeral.vue';
    import Paragraph from '../../paragraph.vue';
    import Text from '../../text.vue';
    import Title from '../../title.vue';
    import Typography from '../../typography.vue';

    const emit = defineEmits<{ roots: [roots: unknown[]] }>();
    const text = useTemplateRef<InstanceType<typeof Text>>('text');
    const title = useTemplateRef<InstanceType<typeof Title>>('title');
    const paragraph = useTemplateRef<InstanceType<typeof Paragraph>>('paragraph');
    const numeral = useTemplateRef<InstanceType<typeof Numeral>>('numeral');
    const typography = useTemplateRef<InstanceType<typeof Typography>>('typography');
    onMounted(() =>
        emit(
            'roots',
            [text, title, paragraph, numeral, typography].map((item) => item.value?.$el)
        )
    );
</script>

<template>
    <div>
        <Text ref="text">a</Text>
        <Title ref="title">b</Title>
        <Paragraph ref="paragraph">c</Paragraph>
        <Numeral ref="numeral">1</Numeral>
        <Typography ref="typography">d</Typography>
    </div>
</template>
