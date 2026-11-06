import { CodeHighlight } from '@fibrae/semi-ui-react';

const code = `
import * as React from 'react'
const Test = ()=>{
    const handleClick = ()=>{
        alert("Click")
    }
    return <div onClick={handleClick}>test</div>
}`;

export default function CodeHighlightDemo() {
    return <CodeHighlight code={code} language="javascript" />;
}
