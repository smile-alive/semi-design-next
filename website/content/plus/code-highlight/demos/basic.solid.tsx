import { CodeHighlight } from '@fibrae/semi-ui-solid';

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
