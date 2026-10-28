/** A Motion spring transition */
export interface SpringTransition {
    type: 'spring';
    stiffness: number;
    damping: number;
}

/**
 * Spring presets as Motion transitions, e.g. `animate(el, keyframes, springs.gentle)` or
 * `<motion.div transition={springs.wobbly} />`. Stiffness and damping carry the react-motion tension and friction
 * values; Motion settles a spring sooner than react-motion did.
 */
export const springs = {
    default: { type: 'spring', stiffness: 170, damping: 26 },
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    wobbly: { type: 'spring', stiffness: 180, damping: 12 },
    stiff: { type: 'spring', stiffness: 210, damping: 20 },
    slow: { type: 'spring', stiffness: 280, damping: 60 },
    molasses: { type: 'spring', stiffness: 280, damping: 120 },
} as const satisfies Record<string, SpringTransition>;

export type SpringName = keyof typeof springs;
