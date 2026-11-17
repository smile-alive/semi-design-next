import { describe, expect, it } from 'vitest';
import { svgToIconData } from '../lib/svg-to-icon-data.ts';

describe('svgToIconData', () => {
    it('turns the svg tree into nested nodes and normalises numeric attributes', () => {
        const svg = '<svg viewBox="0 0 24 24" width="24.0"><g opacity=".5"><path d="M1 1h2"/></g></svg>';
        expect(svgToIconData('demo', svg, [])).toEqual({
            name: 'demo',
            attrs: { viewBox: '0 0 24 24', width: '24' },
            children: [['g', { opacity: '0.5' }, [['path', { d: 'M1 1h2' }]]]],
        });
    });

    it('counts fills as the highest placeholder index plus one', () => {
        const svg = '<svg><path fill="{fill2}"/><path fill="{fill0}"/></svg>';
        expect(svgToIconData('demo', svg, []).fills).toBe(3);
    });

    it('leaves out fills when the svg has no placeholder', () => {
        expect(svgToIconData('demo', '<svg><path/></svg>', [])).not.toHaveProperty('fills');
    });

    it('throws when the root element is not svg', () => {
        expect(() => svgToIconData('demo', '<g><path/></g>', [])).toThrow('demo.svg has no root svg element');
    });
});
