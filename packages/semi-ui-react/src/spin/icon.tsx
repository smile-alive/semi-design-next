import { useId } from 'react';
import semiGlobal from '../_utils/semi-global';

export default function Icon() {
    // the url(#id) gradient reference needs an id unique per instance and equal on server and client
    const gradientId = `linearGradient-${useId()}`;
    const globalIndicator = semiGlobal?.config?.overrideDefaultProps?.Spin?.indicator;

    if (globalIndicator) {
        return globalIndicator;
    }

    return (
        <svg data-icon="spin" aria-hidden height="48" version="1.1" viewBox="0 0 36 36" width="48" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={gradientId} x1="0%" x2="100%" y1="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                    <stop offset="39.9430698%" stopColor="currentColor" stopOpacity="0.50" />
                    <stop offset="100%" stopColor="currentColor" />
                </linearGradient>
            </defs>
            <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
                <rect fill="none" fillOpacity="0.01" height="36" width="36" x="0" y="0" />
                <path d="M34,18 C34,9.163444 26.836556,2 18,2 C11.6597233,2 6.18078805,5.68784135 3.59122325,11.0354951" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeWidth="4" />
            </g>
        </svg>
    );
}
