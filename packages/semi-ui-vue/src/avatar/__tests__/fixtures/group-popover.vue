<script setup lang="ts">
    import Popover from '../../../popover/popover.vue';
    import AvatarGroup from '../../avatar-group.vue';
    import Avatar from '../../avatar.vue';
</script>

<template>
    <AvatarGroup :maxCount="2">
        <Avatar v-for="value in ['LL', 'CX', 'RM', 'ZL']" :key="value">{{ value }}</Avatar>
        <template #more="{ restNumber, restAvatars }">
            <Popover ariaLabel="Rest" :motion="false" trigger="custom" visible>
                <Avatar>+{{ restNumber }}</Avatar>
                <template #content>
                    <div data-testid="popup">
                        <component :is="node" v-for="(node, index) in restAvatars" :key="index" />
                    </div>
                </template>
            </Popover>
        </template>
    </AvatarGroup>
</template>
