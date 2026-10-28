<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Checkbox, type CheckboxEvent } from '@fibrae/semi-ui-vue';

    const checked = ref(true);
    const disabled = ref(false);
    const label = computed(() => `${checked.value ? 'Checked' : 'Unchecked'} ${disabled.value ? 'Disabled' : 'Enabled'}`);

    const onChange = (e: CheckboxEvent) => console.log('checked = ', e.target.checked);
</script>

<template>
    <div>
        <div :style="{ marginBottom: '20px' }">
            <Checkbox v-model="checked" aria-label="Checkbox 示例" :disabled="disabled" @change="onChange">
                {{ label }}
            </Checkbox>
        </div>
        <p>
            <Button size="small" type="primary" @click="checked = !checked">{{ !checked ? 'Check' : 'Uncheck' }}</Button>
            <Button size="small" :style="{ marginLeft: '10px' }" type="primary" @click="disabled = !disabled">
                {{ !disabled ? 'Disable' : 'Enable' }}
            </Button>
        </p>
    </div>
</template>
