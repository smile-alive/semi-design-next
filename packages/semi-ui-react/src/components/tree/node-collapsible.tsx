import { type ReactNode, useEffect, useState } from 'react';
import Collapsible from '../collapsible';

interface NodeCollapsibleProps {
    open?: boolean;
    motion?: boolean;
    duration?: number;
    onMotionEnd?: () => void;
    children?: ReactNode;
}

/**
 * Mounts in the `open` state and flips it once so Collapsible animates;
 * later `open` changes are ignored so the motion never reverses
 */
export default function NodeCollapsible({ open, children, ...rest }: NodeCollapsibleProps) {
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
        // flip after the mount commits so Collapsible animates; @starting-style covers the unpainted state
        const timer = setTimeout(() => setIsOpen((prev) => !prev), 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Collapsible {...rest} isOpen={isOpen}>
            {children}
        </Collapsible>
    );
}
