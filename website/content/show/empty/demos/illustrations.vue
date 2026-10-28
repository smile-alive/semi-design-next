<script setup lang="ts">
    import {
        IllustrationConstruction,
        IllustrationConstructionDark,
        IllustrationFailure,
        IllustrationFailureDark,
        IllustrationIdle,
        IllustrationIdleDark,
        IllustrationNoAccess,
        IllustrationNoAccessDark,
        IllustrationNoContent,
        IllustrationNoContentDark,
        IllustrationNotFound,
        IllustrationNotFoundDark,
        IllustrationNoResult,
        IllustrationNoResultDark,
        IllustrationSuccess,
        IllustrationSuccessDark,
    } from '@fibrae/semi-illustrations-vue';
    import { Empty } from '@fibrae/semi-ui-vue';

    const emptyStyle = { padding: '30px' };
    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <div :style="{ display: 'flex', flexWrap: 'wrap' }">
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationSuccess :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationSuccessDark :style="imageStyle" />
            </template>
            <template #description>创建成功</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationFailure :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationFailureDark :style="imageStyle" />
            </template>
            <template #description>加载失败</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationNoAccess :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationNoAccessDark :style="imageStyle" />
            </template>
            <template #description>没有权限</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationNoContent :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationNoContentDark :style="imageStyle" />
            </template>
            <template #description>暂无内容，请添加</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationNotFound :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationNotFoundDark :style="imageStyle" />
            </template>
            <template #description>页面404</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationNoResult :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationNoResultDark :style="imageStyle" />
            </template>
            <template #description>搜索无结果</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationConstruction :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationConstructionDark :style="imageStyle" />
            </template>
            <template #description>建设中</template>
        </Empty>
        <Empty :style="emptyStyle">
            <template #image>
                <IllustrationIdle :style="imageStyle" />
            </template>
            <template #darkModeImage>
                <IllustrationIdleDark :style="imageStyle" />
            </template>
            <template #description>神游四方</template>
        </Empty>
    </div>
</template>
