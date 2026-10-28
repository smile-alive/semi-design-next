<script setup lang="ts">
    import AutoComplete from '../..';

    defineOptions({ inheritAttrs: false });
    defineProps</* @vue-ignore */ Parameters<typeof AutoComplete>[0]>();
</script>

<template>
    <AutoComplete :data="['semi', 'design']" :motion="false" placeholder="pick" v-bind="$attrs">
        <template #trigger="{ value, inputValue, placeholder, disabled, controlAttrs, componentProps, onChange, onClear, onFocus, onBlur }">
            <div class="custom-trigger">
                <span data-testid="selected">{{ value.map((item) => item.label).join(',') || 'empty' }}</span>
                <span data-testid="input">{{ inputValue }}</span>
                <span data-testid="placeholder">{{ placeholder }}</span>
                <span data-testid="disabled">{{ String(disabled) }}</span>
                <span data-testid="props">{{ Object.keys(componentProps).includes('data') }}</span>
                <input v-bind="controlAttrs" class="custom-input" :value="inputValue" @blur="onBlur" @focus="onFocus" @input="onChange(($event.target as HTMLInputElement).value)" />
                <button aria-label="clear" type="button" @click.stop="onClear()" />
            </div>
        </template>
    </AutoComplete>
</template>
