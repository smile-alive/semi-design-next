<script setup lang="ts">
    import { inject, provide, type InjectionKey } from 'vue';
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const reachableKey: InjectionKey<string> = Symbol('reachable');
    provide(reachableKey, 'Light');

    const [toast, Holder] = Toast.useToast();
    // The function is rendered as a functional component inside the toast, so it can inject from where Holder sits
    const config = {
        duration: 0,
        content: () => `ReachableContext: ${inject(reachableKey)}`,
    };
</script>

<template>
    <div>
        <Button @click="toast.success(config)">Hook Toast</Button>
    </div>
    <Holder />
</template>
