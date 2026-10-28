import type { IconData } from '../types';

const IconTriangleArrow: IconData = {
    name: 'triangle_arrow',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        ['g', { 'clip-path': 'url(#{uid}__clip_triangle_arrow)' }, [['path', { d: 'M24 9v1c-4 0-5.5 1-7.5 3S14 16 12 16s-2.5-1-4.5-3S4 10 0 10V9h24', fill: 'currentColor' }]]],
        ['defs', {}, [['clipPath', { id: '{uid}__clip_triangle_arrow' }, [['rect', { width: '24', height: '24', fill: 'currentColor', transform: 'translate(24) rotate(90)' }]]]]],
    ],
};

export default IconTriangleArrow;
