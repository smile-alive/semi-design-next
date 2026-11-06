import { For } from 'solid-js';
import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-solid';
import { Button } from '@fibrae/semi-ui-solid';

const contents = ['Colorful', undefined];
// Icons are passed as components: only a component receives the colorful fill
const rows = [
    { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
    { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
] as const;

export default function ButtonDemo() {
    return (
        <For each={contents}>
            {(content) => (
                <div style={{ display: 'flex', 'row-gap': '16px', 'margin-block-start': '20px', 'margin-inline-start': '10px', 'flex-direction': 'column' }}>
                    <For each={rows}>
                        {(row) => (
                            <div style={{ display: 'flex', 'column-gap': '16px' }}>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" icon={row.primaryIcon}>
                                    {content}
                                </Button>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" loading>
                                    {content}
                                </Button>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" icon={row.primaryIcon} disabled>
                                    {content}
                                </Button>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" icon={row.tertiaryIcon}>
                                    {content}
                                </Button>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" loading>
                                    {content}
                                </Button>
                                <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" icon={row.tertiaryIcon} disabled>
                                    {content}
                                </Button>
                            </div>
                        )}
                    </For>
                </div>
            )}
        </For>
    );
}
