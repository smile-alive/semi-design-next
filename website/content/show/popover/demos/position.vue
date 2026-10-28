<script setup lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-vue';
    import { Empty, Popover, Tag, type Position } from '@fibrae/semi-ui-vue';

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
    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <div>
        <div :style="{ marginLeft: '80px', whiteSpace: 'nowrap' }">
            <Popover v-for="[position, label] in tops" :key="position" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px' }">{{ label }}</Tag>
                <template #content>
                    <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                        <template #image>
                            <IllustrationSuccess :style="imageStyle" />
                        </template>
                        <template #darkModeImage>
                            <IllustrationSuccessDark :style="imageStyle" />
                        </template>
                        <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                    </Empty>
                </template>
            </Popover>
        </div>
        <div :style="{ width: '80px', float: 'left' }">
            <Popover v-for="[position, label] in lefts" :key="position" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                        <template #image>
                            <IllustrationSuccess :style="imageStyle" />
                        </template>
                        <template #darkModeImage>
                            <IllustrationSuccessDark :style="imageStyle" />
                        </template>
                        <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                    </Empty>
                </template>
            </Popover>
        </div>
        <div :style="{ width: '40px', marginLeft: '300px' }">
            <Popover v-for="[position, label] in rights" :key="position" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                        <template #image>
                            <IllustrationSuccess :style="imageStyle" />
                        </template>
                        <template #darkModeImage>
                            <IllustrationSuccessDark :style="imageStyle" />
                        </template>
                        <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                    </Empty>
                </template>
            </Popover>
        </div>
        <div :style="{ marginLeft: '80px', clear: 'both', whiteSpace: 'nowrap' }">
            <Popover v-for="[position, label] in bottoms" :key="position" :position="position">
                <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ label }}</Tag>
                <template #content>
                    <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                        <template #image>
                            <IllustrationSuccess :style="imageStyle" />
                        </template>
                        <template #darkModeImage>
                            <IllustrationSuccessDark :style="imageStyle" />
                        </template>
                        <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                    </Empty>
                </template>
            </Popover>
        </div>
    </div>
</template>
