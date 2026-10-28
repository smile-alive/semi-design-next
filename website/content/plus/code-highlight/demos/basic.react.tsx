import { CodeHighlight } from '@fibrae/semi-ui-react';

export default function CodeHighlightDemo() {
    return (
        <CodeHighlight
            language="javascript"
            code={`
import * as React from 'react'
const Test = ()=>{
    const handleClick = ()=>{
        alert("Click")
    }
    return <div onClick={handleClick}>test</div>
}`}
        />
    );
}
