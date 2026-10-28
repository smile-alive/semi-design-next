import type { ReactNode } from 'react';

// A styled div instead of h5 keeps these labels out of the page TOC
export default function CustomH5({ children }: { children?: ReactNode }) {
    return <div style={{ fontSize: '16px', lineHeight: '28px', fontWeight: 500 }}>{children}</div>;
}
