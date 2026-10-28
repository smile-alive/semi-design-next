<script setup lang="ts">
    import { Tag, Tooltip, type Position } from '@fibrae/semi-ui-vue';

    const tops: [Position, string][] = [
        ['topLeft', 'TL'],
        ['top', 'Top'],
        ['topRight', 'TR'],
    ];
    const lefts: [Position, string][] = [
        ['leftTop', 'LT'],
        ['left', 'Left'],
        ['leftBottom', 'LB'],
    ];
    const rights: [Position, string][] = [
        ['rightTop', 'RT'],
        ['right', 'Right'],
        ['rightBottom', 'RB'],
    ];
    const bottoms: [Position, string][] = [
        ['bottomLeft', 'BL'],
        ['bottom', 'Bottom'],
        ['bottomRight', 'BR'],
    ];
</script>

<template>
    <div>
        <div :style="{ marginLeft: '80px', whiteSpace: 'nowrap' }">
            <Tooltip v-for="[position, label] in tops" :key="position" :arrowPointAtCenter="false" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px' }">{{ label }}</Tag>
                <template #content>
                    <article>
                        <p>hi bytedance</p>
                        <p>hi bytedance</p>
                    </article>
                </template>
            </Tooltip>
        </div>
        <div :style="{ width: '80px', float: 'left' }">
            <Tooltip v-for="[position, label] in lefts" :key="position" :arrowPointAtCenter="false" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <article>
                        <p>hi bytedance</p>
                        <p>hi bytedance</p>
                    </article>
                </template>
            </Tooltip>
        </div>
        <div :style="{ width: '40px', marginLeft: '300px' }">
            <Tooltip v-for="[position, label] in rights" :key="position" :arrowPointAtCenter="false" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <article>
                        <p>hi bytedance</p>
                        <p>hi bytedance</p>
                    </article>
                </template>
            </Tooltip>
        </div>
        <div :style="{ marginLeft: '80px', clear: 'both', whiteSpace: 'nowrap' }">
            <Tooltip v-for="[position, label] in bottoms" :key="position" :arrowPointAtCenter="false" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <article>
                        <p>hi bytedance</p>
                        <p>hi bytedance</p>
                    </article>
                </template>
            </Tooltip>
        </div>
    </div>
</template>
