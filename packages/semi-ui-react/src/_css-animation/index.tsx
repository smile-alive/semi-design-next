import type React from 'react';
import { type CSSProperties, type ReactNode, useEffectEvent, useLayoutEffect, useState } from 'react';

interface AnimationEventsNeedBind {
    onAnimationStart?: (e: React.AnimationEvent) => void;
    onAnimationEnd?: (e: React.AnimationEvent) => void;
}

interface AnimationProps {
    startClassName?: string;
    endClassName?: string;
    children: (args: { animationClassName: string; animationStyle: CSSProperties; animationEventsNeedBind: AnimationEventsNeedBind; isAnimating: boolean }) => ReactNode;
    animationState: 'enter' | 'leave';
    onAnimationEnd?: (stoppedByAnother: boolean) => void;
    onAnimationStart?: () => void;
    motion?: boolean;
    replayKey?: string;
    fillMode?: 'backwards' | 'both' | 'forwards' | 'none';
    /** The animated element; when it has no running animation after a commit, the animation ends at once */
    getElement?: () => Element | null | undefined;
}

export default function CSSAnimation({ startClassName, endClassName, children, onAnimationEnd, onAnimationStart, motion = true, replayKey = '', fillMode, getElement }: AnimationProps) {
    const [run, setRun] = useState(() => ({
        startClassName,
        replayKey,
        motion,
        restarts: 0,
        className: startClassName,
        isAnimating: true,
    }));

    // adjusted during render so the start class commits together with the props that asked for it
    let current = run;

    if (startClassName !== run.startClassName || replayKey !== run.replayKey || motion !== run.motion) {
        current = {
            startClassName,
            replayKey,
            motion,
            restarts: run.restarts + 1,
            className: startClassName,
            isAnimating: true,
        };
        setRun(current);
    }

    // Without motion it is a zero-duration animation, so start/end callbacks always fire
    const started = useEffectEvent((restarted: boolean) => {
        onAnimationStart?.();
        if (!motion) {
            onAnimationEnd?.(restarted);
        }
    });

    // No animationend comes when the page cancels the animation (`animation: none`); getAnimations() flushes style, so
    // it lists the animation this commit's class started. Transitions are excluded: they never fire animationend.
    const endIfNotAnimating = useEffectEvent(() => {
        const animations = getElement?.()?.getAnimations();
        if (motion && animations && !animations.some((animation) => 'animationName' in animation)) {
            setRun((prev) => ({ ...prev, className: endClassName, isAnimating: false }));
            onAnimationEnd?.(false);
        }
    });

    useLayoutEffect(() => started(current.restarts > 0), [current.restarts]);
    useLayoutEffect(() => endIfNotAnimating(), [current.restarts]);

    if (!motion) {
        return children({
            animationClassName: '',
            animationStyle: {},
            animationEventsNeedBind: {},
            isAnimating: false,
        });
    }

    return children({
        animationClassName: current.className ?? '',
        animationStyle: { animationFillMode: fillMode },
        animationEventsNeedBind: {
            // Events bubble, also across portals; ignore descendants' animations
            onAnimationStart: (e) => {
                if (e.target === e.currentTarget) {
                    onAnimationStart?.();
                }
            },
            onAnimationEnd: (e) => {
                if (e.target !== e.currentTarget) {
                    return;
                }
                setRun((prev) => ({ ...prev, className: endClassName, isAnimating: false }));
                onAnimationEnd?.(false);
            },
        },
        isAnimating: current.isAnimating,
    });
}
