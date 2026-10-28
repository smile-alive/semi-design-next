<script setup lang="ts">
    import { CodeHighlight } from '@fibrae/semi-ui-vue';

    const code = `
import * as React from 'react'
const Test = ()=>{
    const handleClick = ()=>{
        alert("Click")
    }
    return <div onClick={handleClick}>test</div>
}`;
</script>

<template>
    <CodeHighlight :code="code" language="javascript" />
</template>
