import { Show } from 'solid-js';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { Button, JsonViewer } from '@fibrae/semi-ui-solid';

const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;

export default function JsonViewerDemo() {
    return (
        <div style={{ 'margin-bottom': '16px' }}>
            <JsonViewer
                height={200}
                width={700}
                value={data}
                renderSearchButton={(defaultButton, controls) => (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', 'z-index': '10' }}>
                        <Show when={!controls.showSearchBar} fallback={defaultButton()}>
                            <Button icon={<IconSearch />} onClick={controls.onToggleSearchBar}>
                                搜索
                            </Button>
                        </Show>
                    </div>
                )}
            />
        </div>
    );
}
