import chroma from 'chroma-js';
import { IconSun, IconMoon } from '@fibrae/semi-icons-react';
import { Toast, Tabs, TabPane, Tooltip } from '@fibrae/semi-ui-react';
import { paletteColors } from '../theme-tokens.js';
import styles from '../tokens.module.css';

type Theme = 'light' | 'dark';

// WCAG 2.0 contrast levels, same algorithm as wcag-color's scoreFromRatio
const scoreFromRatio = (ratio: number) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail');

function toUpper(str: string) {
    const color = str
        .toLowerCase()
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.substr(1))
        .join(' ');
    if (color.indexOf('Ai ') === 0) {
        return 'AI' + color.slice(2);
    }
    return color;
}

const colors = ['red', 'pink', 'purple', 'violet', 'indigo', 'blue', 'light blue', 'cyan', 'teal', 'green', 'light green', 'lime', 'yellow', 'amber', 'orange', 'grey', 'ai purple', 'ai general'];

function getColorCapClassNameForAIGeneral(theme: Theme | undefined, colorName: string) {
    const number = colorName.slice(colorName.lastIndexOf(' ') + 1) ?? 0;
    const ltMiddle = Number(number) < 5;
    if (theme === 'light') {
        return ltMiddle ? 'black' : 'white';
    }
    return ltMiddle ? 'white' : 'black';
}

interface ColorBlockProps {
    colorKey: string;
    colorVar: string;
    theme?: Theme;
}

export function ColorBlock({ colorKey, colorVar, theme }: ColorBlockProps) {
    const niceName = colorKey.replace('--semi-', '').replace(/-/g, ' ');
    const isAiGeneral = colorKey.includes('--semi-ai-general-');
    const colorName = toUpper(niceName);
    const wscore = isAiGeneral ? 'fail' : scoreFromRatio(chroma.contrast(colorVar, '#ffffff'));
    const bscore = isAiGeneral ? 'fail' : scoreFromRatio(chroma.contrast(colorVar, '#000000'));
    const colorCapClassName = isAiGeneral ? getColorCapClassNameForAIGeneral(theme, colorName) : wscore !== 'Fail' ? 'white' : 'black';
    const clipText = `var(${colorKey})`;

    const copy = () =>
        navigator.clipboard.writeText(clipText).then(() =>
            Toast.success({
                content: (
                    <span>
                        颜色 <code>{clipText}</code> 已复制
                    </span>
                ),
                duration: 3,
            })
        );

    const content = (
        <button type="button" className={styles['color-block']} style={{ border: 'none', fontFamily: 'inherit', color: 'inherit', textAlign: 'left' }} onClick={copy}>
            <span className={styles['color-rect']} data-color={colorVar} style={isAiGeneral ? { background: colorVar } : { backgroundColor: colorVar }} />
            <span className={`${styles['color-cap']} ${styles[colorCapClassName]}`}>
                <span className={styles['color-name']}>{colorName}</span>
                <span className={`${styles['color-value']} ${isAiGeneral ? styles['color-value-gradient'] : ''}`}>{colorVar}</span>
            </span>
            {!isAiGeneral && (
                <span className={styles.ratios}>
                    {wscore !== 'Fail' && <span className={`${styles['color-ratio']} ${styles.white}`}>{wscore}</span>}
                    {bscore !== 'Fail' && <span className={`${styles['color-ratio']} ${styles.black}`}>{bscore}</span>}
                </span>
            )}
        </button>
    );

    return isAiGeneral ? (
        <Tooltip content={colorVar}>
            <span>{content}</span>
        </Tooltip>
    ) : (
        content
    );
}

const columns = (obj: Record<string, string>, theme: Theme) =>
    colors.map((name) => (
        <div key={name} className={styles['color-column']}>
            {Object.keys(obj)
                .filter((key) => key.replace('--semi-', '').replace(/-/g, ' ').replace(/\s\d/g, '') === name)
                .map((key) => (
                    <ColorBlock key={key} colorKey={key} colorVar={obj[key]} theme={theme} />
                ))}
        </div>
    ));

export default function FullPalette() {
    return (
        <div className={styles['full-palette']}>
            <Tabs type="line">
                <TabPane
                    tab={
                        <span>
                            <IconSun />
                            Light
                        </span>
                    }
                    itemKey="light"
                >
                    <div className={styles['color-grid']}>{columns(paletteColors.light, 'light')}</div>
                </TabPane>
                <TabPane
                    tab={
                        <span>
                            <IconMoon />
                            Dark
                        </span>
                    }
                    itemKey="dark"
                >
                    <div className={styles['color-grid']}>{columns(paletteColors.dark, 'dark')}</div>
                </TabPane>
            </Tabs>
        </div>
    );
}
