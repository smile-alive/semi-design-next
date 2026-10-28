import { useRef } from 'react';
import { JsonViewer, Button, type JsonViewerHandle } from '@fibrae/semi-ui-react';
const data = `{
  "name": "Semi",
  "version": "0.0.0"
}`;
export default function JsonViewerDemo() {
    const jsonviewerRef = useRef<JsonViewerHandle>(null);
    return (
        <div>
            <Button onClick={() => console.log(jsonviewerRef.current?.format())}>格式化</Button>
            <div style={{ marginBottom: 16, marginTop: 16 }}>
                <JsonViewer ref={jsonviewerRef} height={100} width={700} value={data} options={{ formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' } }} />
            </div>
        </div>
    );
}
