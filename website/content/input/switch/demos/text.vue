<script setup lang="ts">
    import { Switch } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Switch aria-label="带开关文字的开关">
            <template #checkedText>开</template>
            <template #uncheckedText>关</template>
        </Switch>
        <Switch aria-label="带符号文字的开关" :style="{ marginLeft: '5px' }">
            <template #checkedText>｜</template>
            <template #uncheckedText>〇</template>
        </Switch>
        <br />
        <br />
        <Switch aria-label="带开关文字的开关，已开启" defaultChecked>
            <template #checkedText>开</template>
            <template #uncheckedText>关</template>
        </Switch>
        <Switch aria-label="带符号文字的开关，已开启" defaultChecked :style="{ marginLeft: '5px' }">
            <template #checkedText>｜</template>
            <template #uncheckedText>〇</template>
        </Switch>
        <br />
        <br />
        <Switch aria-label="大号带开关文字的开关" size="large">
            <template #checkedText>开</template>
            <template #uncheckedText>关</template>
        </Switch>
        <Switch aria-label="大号带符号文字的开关" size="large" :style="{ marginLeft: '5px' }">
            <template #checkedText>｜</template>
            <template #uncheckedText>〇</template>
        </Switch>
        <br />
        <br />
        <Switch aria-label="大号带开关文字的开关，已开启" defaultChecked size="large">
            <template #checkedText>开</template>
            <template #uncheckedText>关</template>
        </Switch>
        <Switch aria-label="大号带符号文字的开关，已开启" defaultChecked size="large" :style="{ marginLeft: '5px' }">
            <template #checkedText>｜</template>
            <template #uncheckedText>〇</template>
        </Switch>
    </div>
</template>
