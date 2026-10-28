import type { ReactNode } from 'react';

// A styled div instead of h4 keeps these labels out of the page TOC
export default function CustomH4({ children }: { children?: ReactNode }) {
    return <div style={{ fontSize: '19px', lineHeight: '40px', fontWeight: 500 }}>{children}</div>;
}
