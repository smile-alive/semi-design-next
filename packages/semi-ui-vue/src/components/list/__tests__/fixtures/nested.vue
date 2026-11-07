<script setup lang="ts">
    import List, { ListItem } from '../..';
    import Button from '../../../button';

    const emit = defineEmits<{ inner: []; outer: [event: MouseEvent] }>();
</script>

<template>
    <List>
        <ListItem @click="emit('outer', $event)">
            <template #main>outer</template>
            <template #extra>
                <List>
                    <ListItem>
                        <template #main>inner</template>
                        <template #extra>
                            <Button @click="emit('inner')">InnerAct</Button>
                        </template>
                    </ListItem>
                </List>
            </template>
        </ListItem>
    </List>
</template>
