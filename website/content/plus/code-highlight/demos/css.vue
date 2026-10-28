<script setup lang="ts">
    import { CodeHighlight } from '@fibrae/semi-ui-vue';

    const code = `.grid {
    .semi-row,
    .semi-row-flex {
        text-align: center;
        .semi-col {
            min-height: 30px;
            line-height: 30px;
            background: var(--semi-color-primary-light-default);
            outline: 1px solid var(--semi-color-primary-light-active);
        }
    }
}
`;
</script>

<template>
    <CodeHighlight :code="code" language="css" />
</template>
