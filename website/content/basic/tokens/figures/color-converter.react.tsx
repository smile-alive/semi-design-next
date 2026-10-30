import { useState } from 'react';
import chroma from 'chroma-js';
import { Input } from '@fibrae/semi-ui-react';
import { paletteColors, functionalColors } from '../theme-tokens.js';
import styles from '../tokens.module.css';
import { ColorBlock } from './full-palette.react.tsx';

interface ClosestColor {
    name: string;
    value: string;
    distance: number;
}

function getClosestColors(color: string, colors: Record<string, string>): ClosestColor[] {
    const scores: { distance: number; name: string }[] = [];
    for (const name in colors) {
        const targetColor = colors[name];
        // AI general colors are gradients with no single color to compare
        if (!chroma.valid(targetColor)) {
            continue;
        }
        scores.push({ distance: chroma.distance(color, targetColor), name });
    }
    const sorted = scores.sort((a, b) => a.distance - b.distance);
    const min = sorted[0].distance;
    return sorted.filter((item) => item.distance === min).map(({ name, distance }) => ({ name, value: colors[name], distance }));
}

export default function ColorConverter() {
    const [inputColor, setInputColor] = useState('');
    const [results, setResults] = useState<ClosestColor[]>([]);

    const convert = () => {
        if (inputColor.trim().length === 0) {
            setResults([]);
            return;
        }
        if (!chroma.valid(inputColor)) {
            return;
        }
        const paletteResult = getClosestColors(inputColor, paletteColors.light);
        const cssVarsResult = getClosestColors(inputColor, functionalColors.light);
        setResults([...cssVarsResult, ...paletteResult].toSorted((a, b) => a.distance - b.distance));
    };

    return (
        <div className={styles['color-converter']}>
            <Input value={inputColor} onChange={setInputColor} onKeyUp={convert} placeholder="输入颜色值" style={{ maxWidth: 300, marginBottom: 16 }} prefix="search" />
            <div className={styles['color-results']}>
                {results.map((item) => (
                    <ColorBlock key={item.name} colorKey={item.name} colorVar={item.value} />
                ))}
            </div>
        </div>
    );
}
