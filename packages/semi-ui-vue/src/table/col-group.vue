<script setup lang="ts">
    import { flattenColumns } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { nativeTag } from '../_base/native-tag';
    import type { ColumnProps, TableComponent } from './interface';

    const props = defineProps<{
        columns: ColumnProps[];
        prefixCls: string;
        wrapper?: TableComponent;
        col?: TableComponent;
    }>();

    // a string :is would resolve a globally registered Col
    const Colgroup = nativeTag('colgroup');
    const Col = nativeTag('col');

    const leafColumns = () => flattenColumns(props.columns) as ColumnProps[];
</script>

<template>
    <component :is="props.wrapper ?? Colgroup" :class="`${props.prefixCls}-colgroup`">
        <component :is="props.col ?? Col" v-for="(column, index) in leafColumns()" :key="column.key ?? column.dataIndex ?? index" :class="[`${props.prefixCls}-col`, column.class]" :style="column.width ? { width: toCssLength(column.width), minWidth: toCssLength(column.width) } : {}" />
    </component>
</template>
