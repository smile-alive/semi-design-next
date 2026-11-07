<script setup lang="ts">
    import Input, { InputGroup } from '../..';

    defineProps<{ groupDisabled?: boolean }>();
    const emit = defineEmits<{ groupFocus: [event: FocusEvent]; groupBlur: [event: FocusEvent]; childFocus: [] }>();
</script>

<template>
    <InputGroup aria-labelledby="external" class="g" data-group="1" :disabled="groupDisabled" size="small" style="color: red" @blur="emit('groupBlur', $event)" @focus="emit('groupFocus', $event)">
        <Input :disabled="false" placeholder="own-enabled" @focus="emit('childFocus')" />
        <Input disabled placeholder="shorthand" />
        <Input placeholder="inherit" size="large" />
    </InputGroup>
</template>
