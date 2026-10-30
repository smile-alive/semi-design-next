<script setup lang="ts">
    import { computed, h, shallowRef, useTemplateRef } from 'vue';
    import { isEqual, omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
    import JsonViewerFoundation, { type JsonViewerAdapter, type JsonViewerBaseProps, type JsonViewerBaseState, type JsonViewerOptions as CoreOptions } from '@fibrae/semi-foundation/json-viewer/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/json-viewer/json-viewer.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { provideJsonViewerContext } from './context';
    import type { JsonViewerCustomRenderSlotProps, JsonViewerEmits, JsonViewerHandle, JsonViewerProps, JsonViewerSearchButtonSlotProps, JsonViewerSearchOptions, JsonViewerSlots } from './interface';
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
    const defaultSearchOptions: JsonViewerSearchOptions = { caseSensitive: false, wholeWord: false, regex: false };

    // merged per key: a whole-object default would be replaced by any caller `options`
    const mergedOptions = computed(() => ({
        ariaLabel: locale.value.locale.content,
        readOnly: false,
        autoWrap: true,
        // an explicit undefined would replace a default
        ...omitBy(props.options ?? {}, (option) => option === undefined),
    }));

    // The core hands a rule's render result back after layout; returning the slot arguments lets #customRender draw it.
    const coreOptions = (): CoreOptions => {
        const { customRenderRule, ...rest } = mergedOptions.value;
        return {
            ...rest,
            ...(customRenderRule && {
                customRenderRule: customRenderRule.map((item, index) => ({
                    match: item.match,
                    render: (content: string): JsonViewerCustomRenderSlotProps => ({ item, index, content }),
                })),
            }),
        };
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, JsonViewerBaseState>(
        JsonViewerFoundation,
        props as Readonly<Omit<JsonViewerProps, 'options'>>,
        () => ({ searchOptions: defaultSearchOptions, showSearchBar: false }),
        (base) => ({
            getEditorRef: () => editor.value as HTMLDivElement,
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            setCustomRenderMap: (map: Map<HTMLElement, JsonViewerCustomRenderSlotProps>) => {
                customRenderEntries.value = Array.from(map, ([el, value]) => ({ ...value, id: nextEntryId++, el }));
            },
            toggleSearchOption: (key) => {
                const { searchOptions } = base.getStates();
                base.setState({ searchOptions: { ...searchOptions, [key]: !searchOptions[key] } });
            },
            toggleSearchBar: () => {
                base.setState({ showSearchBar: !base.getStates().showSearchBar, searchOptions: defaultSearchOptions });
            },
        }),
        { props: { value: () => props.modelValue ?? '', options: coreOptions } }
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

    // A value equal to the editor's own text is the echo of a v-model edit: re-creating would drop the caret.
    useDidUpdate(
        () => ({ value: props.modelValue ?? '', options: mergedOptions.value }),
        (next, previous) => {
            if (isEqual(next.options, previous.options) && next.value === foundation.jsonViewer?.getModel().getValue()) {
                return;
            }
            foundation.destroy();
            foundation.init();
        },
        isEqual
    );

    defineExpose<JsonViewerHandle>({
        getValue: () => foundation.jsonViewer?.getModel().getValue() ?? '',
        format: () => foundation.jsonViewer?.format(),
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
    <div :role="groupRole($attrs)" :style="[sizeStyle(), { position: 'relative' }]">
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
