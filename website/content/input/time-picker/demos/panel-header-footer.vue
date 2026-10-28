<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, TimePicker } from '@fibrae/semi-ui-vue';

    const open = ref(false);
    const closePanel = () => {
        open.value = false;
    };
    const onOpenChange = (value: boolean) => {
        console.log(value);
    };
    const logFooter = (text: string) => console.log(text);
</script>

<template>
    <div>
        <TimePicker v-model:open="open" @openChange="onOpenChange">
            <template #panelHeader>Time Select</template>
            <template #panelFooter>
                <Button @click="closePanel">close</Button>
            </template>
        </TimePicker>
        <br />
        <br />
        <TimePicker type="timeRange">
            <template #panelHeader="{ index }">{{ index === 0 ? 'start header' : 'end header' }}</template>
            <template #panelFooter="{ index }">
                <Button v-if="index === 0" @click="logFooter('start footer')">start footer</Button>
                <Button v-else @click="logFooter('end footer')">end footer</Button>
            </template>
        </TimePicker>
    </div>
</template>
