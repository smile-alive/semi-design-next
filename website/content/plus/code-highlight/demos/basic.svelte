<script lang="ts">
    import { CodeHighlight } from '@fibrae/semi-ui-svelte';

    const code = `
import * as React from 'react'
const Test = ()=>{
    const handleClick = ()=>{
        alert("Click")
    }
    return <div onClick={handleClick}>test</div>
}`;
</script>

<CodeHighlight {code} language="javascript" />
