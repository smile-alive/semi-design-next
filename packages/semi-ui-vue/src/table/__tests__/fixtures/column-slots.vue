<script setup lang="ts">
    import Table from '../..';

    withDefaults(
        defineProps<{
            /** The column dataIndex the table-level #sortIcon renders for, or `all` */
            sortIconFor?: string;
            /** Whether the Name column has its own slots */
            columnSlots?: boolean;
        }>(),
        { sortIconFor: 'all', columnSlots: true }
    );
    const dataSource = [
        { key: '1', name: 'b', age: 2 },
        { key: '2', name: 'a', age: 1 },
    ];
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    const byAge = (a: { age: number }, b: { age: number }) => a.age - b.age;
    const nameFilters = [{ text: 'a', value: 'a' }];
    const ageFilters = [{ text: '1', value: 1 }];
</script>

<template>
    <Table :dataSource="dataSource" :pagination="false">
        <Table.Column dataIndex="name" :filters="nameFilters" :sorter="byName" title="Name">
            <template v-if="columnSlots" #sortIcon>
                <i class="column-sort-icon" />
            </template>
            <template v-if="columnSlots" #filterIcon>
                <i class="column-filter-icon" />
            </template>
            <template v-if="columnSlots" #filterDropdown>
                <p>column panel</p>
            </template>
        </Table.Column>
        <Table.Column dataIndex="age" :filters="ageFilters" :sorter="byAge" title="Age" />
        <template #sortIcon="{ column }">
            <i v-if="sortIconFor === 'all' || column.dataIndex === sortIconFor" class="table-sort-icon" />
        </template>
        <template #filterIcon>
            <i class="table-filter-icon" />
        </template>
        <template #filterDropdown>
            <p>table panel</p>
        </template>
    </Table>
</template>
