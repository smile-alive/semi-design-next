import { useState } from 'react';
import { IconExpand } from '@fibrae/semi-icons-react';
import { Resizable } from '@fibrae/semi-ui-react';
import '../compare.scss';

function Handle() {
    return (
        <div className="handle">
            <div className="knob">
                <IconExpand />
            </div>
        </div>
    );
}

interface CompareProps {
    dark: string;
    light: string;
}

export default function Compare({ dark, light }: CompareProps) {
    const [w, setW] = useState(50);

    return (
        <div className="compare">
            <Resizable
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                }}
                // directions left out of enable stay enabled, so the others are turned off explicitly
                enable={{
                    top: false,
                    right: true,
                    bottom: false,
                    left: false,
                    topRight: false,
                    bottomRight: false,
                    bottomLeft: false,
                    topLeft: false,
                }}
                className="a"
                defaultSize={{
                    width: '50%',
                }}
                // With a percent defaultSize, onChange reports widths relative to .compare
                onChange={(size) => setW(parseFloat(String(size.width)))}
                handleNode={{
                    right: <Handle />,
                }}
                maxWidth="100%"
            />
            <div
                className="clip"
                style={{
                    clipPath: `polygon(0 0, 0 100%, ${w}% 100%, ${w}% 0)`,
                }}
            >
                <div className="inner-image">
                    <img src={dark} alt="dark" />
                </div>
            </div>
            <div className="absolute b">
                <img alt="light" src={light} />
            </div>
        </div>
    );
}
