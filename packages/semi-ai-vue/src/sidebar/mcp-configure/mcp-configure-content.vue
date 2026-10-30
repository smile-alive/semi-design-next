<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import MCPConfigureContentFoundation, { type MCPConfigureContentAdapter, type MCPConfigureContentProps as FoundationProps, type MCPConfigureContentState, type MCPConfigureMode, type MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
    import { getShowOptions } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import { cssClasses as buttonClasses } from '@fibrae/semi-foundation/button/constants';
    import { IconEdit, IconMinus, IconPlus, IconSearch, IconSetting } from '@fibrae/semi-icons-vue';
    import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-vue';
    import SlotFragment from '@fibrae/semi-ui-vue/_base/slot-fragment';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Empty from '@fibrae/semi-ui-vue/empty/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Input from '@fibrae/semi-ui-vue/input/index';
    import Radio, { RadioGroup } from '@fibrae/semi-ui-vue/radio/index';
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import type { MCPConfigureContentEmits, MCPConfigureContentProps, MCPConfigureContentSlots, MCPConfigureOption } from './interface';

    type Foundation = MCPConfigureContentFoundation<MouseEvent>;
    type Adapter = MCPConfigureContentAdapter<MouseEvent>;

    const props = withDefaults(defineProps<MCPConfigureContentProps>(), {
        options: () => [],
        customOptions: () => [],
        filter: undefined,
        placeholder: undefined,
    });

    const emit = defineEmits<MCPConfigureContentEmits>();
    defineSlots<MCPConfigureContentSlots>();

    const locale = useLocale('Sidebar');

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, MCPConfigureContentState>(
        MCPConfigureContentFoundation,
        props as FoundationProps,
        () => ({ mode: strings.MCP_MODE.INNER, inputValue: '', query: '' }),
        () => ({
            notifyConfigureClick: (event, option) => emit('configureClick', event, option as MCPConfigureOption),
            notifyEditClick: (event, option) => emit('editClick', event, option as MCPConfigureOption),
            notifyStatusChange: (options, custom) => {
                const list = options as MCPConfigureOption[];
                if (custom) {
                    emit('update:customOptions', list);
                } else {
                    emit('update:options', list);
                }
                emit('statusChange', list, custom);
            },
            notifyAddClick: (event) => emit('addClick', event),
            notifySearch: (inputValue, custom) => emit('search', inputValue, custom),
        })
    );

    const text = computed(() => locale.value.locale);
    const prefix = cssClasses.MCP_CONFIGURE_CONTENT;
    const buttonCls = buttonClasses.PREFIX;
    const illustrationStyle = { width: '150px', height: '150px' };
    const isCustom = computed(() => state.value.mode === strings.MCP_MODE.CUSTOM);
    const showOptions = computed(() => getShowOptions(props, state.value.mode, state.value.query));
    const activatedCount = computed(() => [...props.options, ...props.customOptions].filter((option) => option.active).length);
    const total = computed(() => props.options.length + props.customOptions.length);

    const statusLabel = (option: MCPOption) => (option.active ? text.value.disable : text.value.enable);
</script>

<template>
    <div :class="prefix">
        <div :class="`${prefix}-header`">
            <RadioGroup :aria-label="text.mcpConfigure" :modelValue="state.mode" type="button" @update:modelValue="foundation.handleModeChange($event as MCPConfigureMode)">
                <Radio :value="strings.MCP_MODE.INNER">{{ text.mcpServers }}</Radio>
                <Radio :value="strings.MCP_MODE.CUSTOM">{{ text.newMcpAdd }}</Radio>
            </RadioGroup>
            <span :class="`${prefix}-header-count`">{{ text.activeMCPNumber }} {{ activatedCount }}/{{ total }}</span>
        </div>
        <Empty v-if="isCustom && props.customOptions.length === 0" :class="`${prefix}-custom-empty`">
            <template #image>
                <IllustrationNoContent :style="illustrationStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationNoContentDark :style="illustrationStyle" />
            </template>
            <template #description>{{ text.emptyCustomMcpInfo }}</template>
            <Button theme="solid" type="primary" @click="foundation.handleAddClick">
                <template #icon>
                    <IconPlus />
                </template>
                <template #default>{{ text.newMcpAdd }}</template>
            </Button>
        </Empty>
        <component :is="isCustom ? 'div' : SlotFragment" v-else :class="isCustom ? [`${prefix}-search`, `${prefix}-search-container`] : undefined">
            <Input :class="isCustom ? undefined : `${prefix}-search`" :modelValue="state.inputValue" :placeholder="props.placeholder ?? text.searchPlaceholder" :showClear="false" @change="foundation.handleSearch">
                <template #prefix>
                    <IconSearch />
                </template>
            </Input>
            <Button v-if="isCustom" theme="solid" type="primary" @click="foundation.handleAddClick">
                <template #icon>
                    <IconPlus />
                </template>
                <template #default>{{ text.newMcpAdd }}</template>
            </Button>
        </component>
        <div :class="`${prefix}-item-container`">
            <template v-for="(option, index) in showOptions" :key="option.value">
                <slot v-if="$slots.item" :custom="isCustom" :index="index" :item="option" name="item" />
                <div v-else :class="`${prefix}-item`">
                    <img v-if="!$slots.icon && option.icon" alt="" :class="`${prefix}-item-sign`" :src="option.icon" />
                    <div v-else :class="`${prefix}-item-sign`">
                        <slot :custom="isCustom" :index="index" :item="option" name="icon" />
                    </div>
                    <div :class="`${prefix}-item-content`">
                        <div :class="`${prefix}-item-content-label`">{{ option.label }}</div>
                        <div :class="`${prefix}-item-content-desc`">
                            <slot :custom="isCustom" :index="index" :item="option" name="desc">{{ option.desc }}</slot>
                        </div>
                    </div>
                    <Button v-if="option.configure" :aria-label="text.configure" :class="[`${prefix}-item-button`, `${prefix}-item-button-configure`]" @click="foundation.onConfigureButtonClick($event, option)">
                        <template #icon>
                            <IconSetting />
                        </template>
                    </Button>
                    <Button v-if="isCustom" :aria-label="text.edit" :class="[`${prefix}-item-button`, `${prefix}-item-button-configure`]" @click="foundation.onEditButtonClick($event, option)">
                        <template #icon>
                            <IconEdit />
                        </template>
                    </Button>
                    <!-- Keeps a focusable trigger so the tooltip reason reaches the keyboard; Button's native disabled
                    leaves the Tab order. No click listener since the status cannot change. -->
                    <Tooltip v-if="option.disabled">
                        <template #content>{{ text.defaultMcpInfo }}</template>
                        <button aria-disabled="true" :aria-label="statusLabel(option)" :class="[buttonCls, `${buttonCls}-${option.active ? 'light' : 'solid'}`, `${buttonCls}-disabled`, `${buttonCls}-primary-disabled`, `${buttonCls}-with-icon`, `${buttonCls}-with-icon-only`, `${prefix}-item-button`]" type="button">
                            <span :class="`${buttonCls}-content`">
                                <IconMinus v-if="option.active" />
                                <IconPlus v-else />
                            </span>
                        </button>
                    </Tooltip>
                    <Button v-else :aria-label="statusLabel(option)" :class="`${prefix}-item-button`" :theme="option.active ? 'light' : 'solid'" type="primary" @click="foundation.handleStatusChange(option, !option.active)">
                        <template #icon>
                            <IconMinus v-if="option.active" />
                            <IconPlus v-else />
                        </template>
                    </Button>
                </div>
            </template>
        </div>
    </div>
</template>
