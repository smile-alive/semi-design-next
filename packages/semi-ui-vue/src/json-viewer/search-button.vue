<script setup lang="ts">
    import { nextTick, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import Button from '../button';
    import DragMove from '../drag-move';
    import useLocale from '../locale/use-locale';
    import { useJsonViewerContext } from './context';
    import SearchBar from './search-bar.vue';

    const ctx = useJsonViewerContext('SearchButton');
    const locale = useLocale('JsonViewer');

    const trigger = useTemplateRef('trigger');

    // A drag that started on the trigger ends with a click on it, which is swallowed; the click follows pointerup in the
    // same task, so the flag clears after it. Keyboard activation is never swallowed.
    let dragged = false;

    const { view } = ctx;
    const prefix = cssClasses.PREFIX;

    const onDragMove = () => {
        dragged = true;
    };

    const onDragEnd = () => {
        setTimeout(() => {
            dragged = false;
        });
    };

    const onTriggerClick = (event: MouseEvent) => {
        if (dragged) {
            event.stopPropagation();
            return;
        }
        ctx.toggleSearchBar();
    };

    // closing unmounts the focused control, so focus returns to the trigger that replaces it
    const close = async () => {
        ctx.toggleSearchBar();
        await nextTick();
        trigger.value?.$el.focus();
    };
</script>

<template>
    <DragMove :constrainer="view.limitSearchButtonBounds ? 'parent' : undefined" @mouseMove="onDragMove" @mouseUp="onDragEnd" @touchCancel="onDragEnd" @touchEnd="onDragEnd" @touchMove="onDragMove">
        <div :style="{ position: 'absolute', top: 0, left: toCssLength(view.width) }">
            <Button v-if="!view.showSearchBar" ref="trigger" :aria-label="locale.locale.search" :class="`${prefix}-search-bar-trigger`" style="position: absolute; top: 20px; right: 20px" @click="onTriggerClick">
                <template #icon>
                    <IconSearch />
                </template>
            </Button>
            <SearchBar v-else @close="close" />
        </div>
    </DragMove>
</template>
