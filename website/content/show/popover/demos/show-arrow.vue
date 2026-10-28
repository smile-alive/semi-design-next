<script setup lang="ts">
    import { Popover, Tag, type Position } from '@fibrae/semi-ui-vue';

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
    <div class="tag-margin-right" :style="{ paddingLeft: '40px' }">
        <div :style="{ marginLeft: '40px', whiteSpace: 'nowrap' }">
            <Popover v-for="[position, label] in tops" :key="position" :position="position" showArrow>
                <Tag>{{ label }}</Tag>
                <template #content>
                    <article>
                        Hi ByteDancer, this is a popover.
                        <br />
                        We have 2 lines.
                    </article>
                </template>
            </Popover>
        </div>
        <div :style="{ width: '40px', float: 'left' }">
            <Popover v-for="[position, label] in lefts" :key="position" :position="position" showArrow>
                <Tag>{{ label }}</Tag>
                <template #content>
                    <article>
                        Hi ByteDancer, this is a popover.
                        <br />
                        We have 2 lines.
                    </article>
                </template>
            </Popover>
        </div>
        <div :style="{ width: '40px', marginLeft: '180px' }">
            <Popover v-for="[position, label] in rights" :key="position" :position="position" showArrow>
                <Tag>{{ label }}</Tag>
                <template #content>
                    <article>
                        Hi ByteDancer, this is a popover.
                        <br />
                        We have 2 lines.
                    </article>
                </template>
            </Popover>
        </div>
        <div :style="{ marginLeft: '40px', clear: 'both', whiteSpace: 'nowrap' }">
            <Popover v-for="[position, label] in bottoms" :key="position" :position="position" showArrow>
                <Tag>{{ label }}</Tag>
                <template #content>
                    <article>
                        Hi ByteDancer, this is a popover.
                        <br />
                        We have 2 lines.
                    </article>
                </template>
            </Popover>
        </div>
    </div>
</template>
