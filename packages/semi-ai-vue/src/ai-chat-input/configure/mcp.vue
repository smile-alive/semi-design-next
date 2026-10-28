<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Dropdown, { DropdownItem, DropdownMenu } from '@fibrae/semi-ui-vue/dropdown/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import type { McpEmits, McpProps, McpSlots } from './interface';

    defineOptions({ name: 'ConfigureMcp' });
    const props = withDefaults(defineProps<McpProps>(), { showConfigure: true });
    const emit = defineEmits<McpEmits>();
    defineSlots<McpSlots>();

    const i18n = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;
    const count = computed(() => props.num ?? props.options.length);
</script>

<template>
    <Dropdown :class="`${prefix}-footer-configure-mcp`">
        <!-- the click must not reach the Dropdown trigger, which would close the menu -->
        <Button :class="`${prefix}-footer-configure-mcp-trigger`" theme="outline" type="tertiary" @click.stop> MCP · {{ count }} </Button>
        <template #content>
            <div :class="`${prefix}-footer-configure-mcp-header`">
                <span :class="`${prefix}-footer-configure-mcp-header-title`">
                    {{ i18n.locale.selected.replace('${count}', String(count)) }}
                </span>
                <Button v-if="props.showConfigure" :class="`${prefix}-footer-configure-mcp-header-config`" theme="outline" @click="emit('configureButtonClick')">
                    {{ i18n.locale.configure }}
                </Button>
            </div>
            <slot>
                <DropdownMenu>
                    <DropdownItem v-for="(item, index) in props.options" :key="item.value" :disabled="item.disabled">
                        <template v-if="$slots.optionIcon" #icon>
                            <slot :index="index" :item="item" name="optionIcon" />
                        </template>
                        {{ item.label }}
                    </DropdownItem>
                </DropdownMenu>
            </slot>
        </template>
    </Dropdown>
</template>
