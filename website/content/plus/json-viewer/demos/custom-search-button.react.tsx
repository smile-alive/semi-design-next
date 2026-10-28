import { IconSearch } from '@fibrae/semi-icons-react';
import { JsonViewer, Button } from '@fibrae/semi-ui-react';

const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;

export default function JsonViewerDemo() {
    return (
        <div style={{ marginBottom: 16 }}>
            <JsonViewer
                height={200}
                width={700}
                value={data}
                renderSearchButton={(defaultButton, controls) => (
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                        {!controls.showSearchBar ? (
                            <Button icon={<IconSearch />} onClick={controls.onToggleSearchBar}>
                                搜索
                            </Button>
                        ) : (
                            defaultButton
                        )}
                    </div>
                )}
            />
        </div>
    );
}
