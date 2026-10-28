<script setup lang="ts">
    import JsonViewer from '../..';

    withDefaults(defineProps<{ show?: 'open' | 'always' | 'never' }>(), { show: 'open' });
</script>

<template>
    <JsonViewer modelValue="1">
        <template #searchButton="{ defaultButton, showSearchBar, onToggleSearchBar, onSearch, onPrevSearch, onNextSearch, onReplace, onReplaceAll }">
            <div>
                <output aria-label="open">{{ showSearchBar }}</output>
                <button type="button" @click="onToggleSearchBar">toggle</button>
                <button
                    type="button"
                    @click="
                        onToggleSearchBar();
                        onSearch('k', true, false, true);
                    "
                >
                    custom
                </button>
                <button type="button" @click="onSearch('s', false, true)">search</button>
                <button type="button" @click="onPrevSearch">prev</button>
                <button type="button" @click="onNextSearch">next</button>
                <button type="button" @click="onReplace('x')">replace</button>
                <button type="button" @click="onReplaceAll('y')">replace all</button>
                <component :is="defaultButton" v-if="show === 'always' || (show === 'open' && showSearchBar)" />
            </div>
        </template>
    </JsonViewer>
</template>
