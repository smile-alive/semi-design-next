import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-react';
import { Button } from '@fibrae/semi-ui-react';

const contents = ['Colorful', undefined];
const rows = [
    { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
    { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
    { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
] as const;

export default function ButtonDemo() {
    return (
        <>
            {contents.map((content) => (
                <div key={content ?? 'icon-only'} style={{ display: 'flex', rowGap: 16, marginBlockStart: 20, marginInlineStart: 10, flexDirection: 'column' }}>
                    {rows.map((row) => (
                        <div key={row.theme} style={{ display: 'flex', columnGap: 16 }}>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" icon={<row.primaryIcon />}>
                                {content}
                            </Button>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" loading>
                                {content}
                            </Button>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="primary" icon={<row.primaryIcon />} disabled>
                                {content}
                            </Button>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" icon={<row.tertiaryIcon />}>
                                {content}
                            </Button>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" loading>
                                {content}
                            </Button>
                            <Button colorful aria-label={content ? undefined : 'AI'} theme={row.theme} type="tertiary" icon={<row.tertiaryIcon />} disabled>
                                {content}
                            </Button>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}
