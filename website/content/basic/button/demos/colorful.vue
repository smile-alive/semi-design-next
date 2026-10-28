<script setup lang="ts">
    import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-vue';
    import { Button } from '@fibrae/semi-ui-vue';

    const contents = ['Colorful', undefined];
    const rows = [
        { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
        { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
        { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
        { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
    ] as const;
</script>

<!-- The text goes in an explicit #default: after a sibling #icon template, a bare {{ content }} gets a leading space,
     which would count as text and break the icon-only layout. -->
<template>
    <div v-for="content in contents" :key="content ?? 'icon-only'" :style="{ display: 'flex', rowGap: '16px', marginTop: '20px', marginLeft: '10px', flexDirection: 'column' }">
        <div v-for="row in rows" :key="row.theme" :style="{ display: 'flex', columnGap: '16px' }">
            <Button :aria-label="content ? undefined : 'AI'" colorful :theme="row.theme" type="primary">
                <template #icon>
                    <component :is="row.primaryIcon" />
                </template>
                <template #default>{{ content }}</template>
            </Button>
            <Button :aria-label="content ? undefined : 'AI'" colorful loading :theme="row.theme" type="primary">
                {{ content }}
            </Button>
            <Button :aria-label="content ? undefined : 'AI'" colorful disabled :theme="row.theme" type="primary">
                <template #icon>
                    <component :is="row.primaryIcon" />
                </template>
                <template #default>{{ content }}</template>
            </Button>
            <Button :aria-label="content ? undefined : 'AI'" colorful :theme="row.theme" type="tertiary">
                <template #icon>
                    <component :is="row.tertiaryIcon" />
                </template>
                <template #default>{{ content }}</template>
            </Button>
            <Button :aria-label="content ? undefined : 'AI'" colorful loading :theme="row.theme" type="tertiary">
                {{ content }}
            </Button>
            <Button :aria-label="content ? undefined : 'AI'" colorful disabled :theme="row.theme" type="tertiary">
                <template #icon>
                    <component :is="row.tertiaryIcon" />
                </template>
                <template #default>{{ content }}</template>
            </Button>
        </div>
    </div>
</template>
