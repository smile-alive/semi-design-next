<script setup lang="ts">
    import { onMounted, shallowRef, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { IconCaseSensitive, IconChevronLeft, IconChevronRight, IconClose, IconRegExp, IconWholeWord } from '@fibrae/semi-icons-vue';
    import { nativeTag } from '../_base/native-tag';
    import Button, { ButtonGroup } from '../button';
    import Input from '../input';
    import useLocale from '../locale/use-locale';
    import { useJsonViewerContext } from './context';

    const emit = defineEmits<{ close: [] }>();

    const ctx = useJsonViewerContext('SearchBar');
    const locale = useLocale('JsonViewer');

    const searchInput = useTemplateRef('searchInput');
    const replaceText = shallowRef('');

    const { view } = ctx;
    const prefix = cssClasses.PREFIX;
    const SearchLandmark = nativeTag('search');

    const searchOptionItems = [
        { key: 'caseSensitive', icon: IconCaseSensitive },
        { key: 'regex', icon: IconRegExp },
        { key: 'wholeWord', icon: IconWholeWord },
    ] as const;

    const optionClass = (key: (typeof searchOptionItems)[number]['key']) => [`${prefix}-search-options-item`, { [`${prefix}-search-options-item-active`]: view.value.searchOptions[key] }];

    const onSearchInput = (text: string) => {
        ctx.search(text);
        // the editor's layout moves focus to its content area while editable
        searchInput.value?.focus();
    };

    // search and replace move focus to the editor; restore it so Esc and Tab continue from the keyboard user's position
    const keepFocus = (run: () => void) => {
        const active = FocusTrapHandle.getDeepActiveElement();
        run();
        active?.focus();
    };

    onMounted(() => searchInput.value?.focus());
</script>

<template>
    <!-- every control closes the bar on Escape; the landmark takes no keyboard handler -->
    <SearchLandmark :aria-label="locale.locale.search" :class="`${prefix}-search-bar-container`" style="position: absolute; top: 20px; right: 20px">
        <div :class="`${prefix}-search-bar`">
            <Input ref="searchInput" :aria-label="locale.locale.search" :class="`${prefix}-search-bar-input`" composition :placeholder="locale.locale.search" :showClear="false" @change="onSearchInput" @keydown.esc.stop="emit('close')" />
            <ul :class="`${prefix}-search-options`">
                <li v-for="{ key, icon } in searchOptionItems" :key="key" :class="optionClass(key)">
                    <Button :aria-label="locale.locale[key]" :aria-pressed="view.searchOptions[key]" theme="borderless" type="tertiary" @click="keepFocus(() => ctx.toggleSearchOption(key))" @keydown.esc.stop="emit('close')">
                        <template #icon>
                            <component :is="icon" />
                        </template>
                    </Button>
                </li>
            </ul>
            <ButtonGroup>
                <Button :aria-label="locale.locale.previousMatch" @click="keepFocus(() => ctx.prevSearch())" @keydown.esc.stop="emit('close')">
                    <template #icon>
                        <IconChevronLeft />
                    </template>
                </Button>
                <Button :aria-label="locale.locale.nextMatch" @click="keepFocus(() => ctx.nextSearch())" @keydown.esc.stop="emit('close')">
                    <template #icon>
                        <IconChevronRight />
                    </template>
                </Button>
            </ButtonGroup>
            <Button :aria-label="locale.locale.close" size="small" theme="borderless" type="tertiary" @click="emit('close')" @keydown.esc.stop="emit('close')">
                <template #icon>
                    <IconClose />
                </template>
            </Button>
        </div>
        <div :class="`${prefix}-replace-bar`">
            <Input v-model="replaceText" :aria-label="locale.locale.replace" :class="`${prefix}-replace-bar-input`" :placeholder="locale.locale.replace" :showClear="false" @keydown.esc.stop="emit('close')" />
            <Button :disabled="view.readOnly" style="width: fit-content" @click="keepFocus(() => ctx.replace(replaceText))" @keydown.esc.stop="emit('close')">
                {{ locale.locale.replace }}
            </Button>
            <Button :disabled="view.readOnly" style="width: fit-content" @click="keepFocus(() => ctx.replaceAll(replaceText))" @keydown.esc.stop="emit('close')">
                {{ locale.locale.replaceAll }}
            </Button>
        </div>
    </SearchLandmark>
</template>
