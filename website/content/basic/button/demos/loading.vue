<script setup lang="ts">
    import { ref } from 'vue';
    import { IconDelete } from '@fibrae/semi-icons-vue';
    import { Button } from '@fibrae/semi-ui-vue';

    const saveLoading = ref(false);
    const delLoading = ref(true);
    const repLoading = ref(true);

    const reset = (status: boolean) => {
        saveLoading.value = status;
        delLoading.value = status;
        repLoading.value = status;
    };
</script>

<template>
    <div>
        <div>
            <div class="btn-margin-right" :style="{ display: 'inline-flex', alignItems: 'center', paddingBottom: '14px' }">
                <Button @click="reset(false)">关闭加载态</Button>
                <Button @click="reset(true)">开启加载态</Button>
            </div>
        </div>
        <hr />
        <Button :loading="saveLoading" :style="{ marginRight: '14px' }" @click="saveLoading = true">保存</Button>
        <Button :loading="delLoading" :style="{ marginRight: '14px' }" type="danger" @click="delLoading = true">
            <template #icon>
                <IconDelete />
            </template>
            删除
        </Button>
        <div :style="{ width: '200px', display: 'inline-block' }">
            <Button block :loading="repLoading" theme="solid" type="warning" @click="repLoading = true">撤销</Button>
        </div>
    </div>
</template>
