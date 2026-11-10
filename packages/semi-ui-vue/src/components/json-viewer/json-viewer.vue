<script setup lang="ts">
    import { computed, h, shallowRef, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/json-viewer/constants';
    import JsonViewerFoundation, { type JsonViewerAdapter, type JsonViewerBaseProps, type JsonViewerBaseState, type JsonViewerOptions as CoreOptions } from '@fibrae/semi-foundation/components/json-viewer/foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/components/json-viewer/json-viewer.scss';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import semiDefault, { semiGlobalDefault } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { provideJsonViewerContext } from './context';
    import type { JsonViewerCustomRenderSlotProps, JsonViewerEmits, JsonViewerHandle, JsonViewerProps, JsonViewerSearchButtonSlotProps, JsonViewerSlots } from './interface';
    import SearchButton from './search-button.vue';

    interface CustomRenderEntry extends JsonViewerCustomRenderSlotProps {
        id: number;
        el: HTMLElement;
    }

    type FoundationProps = Omit<JsonViewerProps, 'options'> & JsonViewerBaseProps;
    type Foundation = JsonViewerFoundation<FoundationProps>;
    type Adapter = JsonViewerAdapter<FoundationProps>;

    const props = withDefaults(defineProps<JsonViewerProps & /* @vue-ignore */ ElementProps<'div', keyof JsonViewerProps | EmitHandlers<JsonViewerEmits>>>(), {
        modelValue: undefined,
        width: () => semiDefault('JsonViewer', 'width', 400),
        height: () => semiDefault('JsonViewer', 'height', 400),
        showSearch: () => semiDefault('JsonViewer', 'showSearch', true),
        options: semiGlobalDefault('JsonViewer', 'options'),
        limitSearchButtonBounds: () => semiDefault('JsonViewer', 'limitSearchButtonBounds', false),
    });

    const emit = defineEmits<JsonViewerEmits>();
    defineSlots<JsonViewerSlots>();

    const locale = useLocale('JsonViewer');

    const editor = useTemplateRef('editor');

    // every layout rebuilds the spans, so a fresh id remounts each Teleport on its new span
    const customRenderEntries = shallowRef<CustomRenderEntry[]>([]);
    let nextEntryId = 0;

    const prefix = cssClasses.PREFIX;
    const mergedOptions = computed(() => JsonViewerFoundation.mergeOptions(props.options as CoreOptions | undefined, locale.value.locale.content));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, JsonViewerBaseState>(
        JsonViewerFoundation,
        props as Readonly<Omit<JsonViewerProps, 'options'>>,
        () => JsonViewerFoundation.getInitialState(),
        () => ({
            getEditorRef: () => editor.value as HTMLDivElement,
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            // The core hands a rule's render result back after layout; returning the slot arguments lets #customRender draw it.
            toCoreOptions: ({ customRenderRule, ...rest }) => ({
                ...rest,
                ...(customRenderRule && {
                    customRenderRule: customRenderRule.map((item, index) => ({
                        match: item.match,
                        render: (content: string): JsonViewerCustomRenderSlotProps => ({ item, index, content }),
                    })),
                }),
            }),
            setCustomRenderMap: (map: Map<HTMLElement, JsonViewerCustomRenderSlotProps>) => {
                customRenderEntries.value = Array.from(map, ([el, value]) => ({ ...value, id: nextEntryId++, el }));
            },
        }),
        { props: { value: () => props.modelValue ?? '', options: () => mergedOptions.value } }
    );

    provideJsonViewerContext({
        view: computed(() => ({
            showSearchBar: state.value.showSearchBar,
            searchOptions: state.value.searchOptions,
            readOnly: mergedOptions.value.readOnly,
            width: props.width,
            limitSearchButtonBounds: props.limitSearchButtonBounds,
        })),
        search: (text) => foundation.search(text),
        prevSearch: () => foundation.prevSearch(),
        nextSearch: () => foundation.nextSearch(),
        replace: foundation.replace,
        replaceAll: foundation.replaceAll,
        toggleSearchOption: foundation.toggleSearchOption,
        toggleSearchBar: foundation.toggleSearchBar,
    });

    const sizeStyle = () => ({ width: toCssLength(props.width), height: toCssLength(props.height) });

    const searchButtonProps = (): JsonViewerSearchButtonSlotProps => ({
        defaultButton: h(SearchButton),
        showSearchBar: state.value.showSearchBar,
        onToggleSearchBar: foundation.toggleSearchBar,
        onSearch: foundation.search,
        onPrevSearch: () => foundation.prevSearch(),
        onNextSearch: () => foundation.nextSearch(),
        onReplace: foundation.replace,
        onReplaceAll: foundation.replaceAll,
    });

    defineExpose<JsonViewerHandle>({
        getValue: foundation.getValue,
        format: foundation.format,
        search: foundation.search,
        getSearchResults: foundation.getSearchResults,
        prevSearch: foundation.prevSearch,
        nextSearch: foundation.nextSearch,
        replace: foundation.replace,
        replaceAll: foundation.replaceAll,
        getStyle: () => ({ width: props.width, height: props.height }),
    });
</script>

<template>
    <div :role="namedRole($attrs)" :style="[sizeStyle(), { position: 'relative' }]">
        <div ref="editor" :class="[prefix, `${prefix}-background`]" :style="sizeStyle()" />
        <template v-if="props.showSearch">
            <slot v-if="$slots.searchButton" name="searchButton" v-bind="searchButtonProps()" />
            <SearchButton v-else />
        </template>
        <!-- the core owns the editor DOM; slot content is teleported into the spans it leaves for matched tokens -->
        <Teleport v-for="entry in customRenderEntries" :key="entry.id" :to="entry.el">
            <slot :content="entry.content" :index="entry.index" :item="entry.item" name="customRender">{{ entry.content }}</slot>
        </Teleport>
    </div>
</template>
