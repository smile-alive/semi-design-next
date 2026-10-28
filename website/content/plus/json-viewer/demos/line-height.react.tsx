import { JsonViewer } from '@fibrae/semi-ui-react';
const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
export default function JsonViewerDemo() {
    return (
        <div>
            <div style={{ marginBottom: 12, overflow: 'hidden' }}>
                <JsonViewer height={100} width={700} value={data} options={{ lineHeight: 20 }} />
            </div>
            <div style={{ marginBottom: 12, overflow: 'hidden' }}>
                <JsonViewer height={120} width={700} value={data} options={{ lineHeight: 24 }} />
            </div>
            <div style={{ marginBottom: 12, overflow: 'hidden' }}>
                <JsonViewer height={120} width={700} value={data} options={{ lineHeight: 26 }} />
            </div>
        </div>
    );
}
