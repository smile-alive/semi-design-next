import { For } from 'solid-js';
import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-solid';
import { Button } from '@fibrae/semi-ui-solid';

// Icons are passed as components: only a component receives the colorful fill
const rows = [
    { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
    { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
] as const;

export default function ButtonDemo() {
    return (
        <For each={['Colorful', undefined]}>
            {(content) => (
                <div style={{ display: 'flex', 'row-gap': '16px', 'margin-top': '20px', 'margin-left': '10px', 'flex-direction': 'column' }}>
                    <For each={rows}>
                        {(row) => (
                            <div style={{ display: 'flex', 'column-gap': '16px' }}>
                                <For each={[{ type: 'primary', icon: row.primaryIcon } as const, { type: 'tertiary', icon: row.tertiaryIcon } as const]}>
                                    {(item) => (
                                        <>
                                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type={item.type} icon={item.icon}>
                                                {content}
                                            </Button>
                                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type={item.type} loading>
                                                {content}
                                            </Button>
                                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type={item.type} icon={item.icon} disabled>
                                                {content}
                                            </Button>
                                        </>
                                    )}
                                </For>
                            </div>
                        )}
                    </For>
                </div>
            )}
        </For>
    );
}
