import { Switch } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    return (
        <div>
            <Switch aria-label="带开关文字的开关" checkedText="开" uncheckedText="关" />
            <Switch aria-label="带符号文字的开关" checkedText="｜" uncheckedText="〇" style={{ marginLeft: 5 }} />
            <br />
            <br />
            <Switch aria-label="带开关文字的开关，已开启" defaultChecked checkedText="开" uncheckedText="关" />
            <Switch aria-label="带符号文字的开关，已开启" defaultChecked checkedText="｜" uncheckedText="〇" style={{ marginLeft: 5 }} />
            <br />
            <br />
            <Switch aria-label="大号带开关文字的开关" checkedText="开" uncheckedText="关" size="large" />
            <Switch aria-label="大号带符号文字的开关" checkedText="｜" uncheckedText="〇" size="large" style={{ marginLeft: 5 }} />
            <br />
            <br />
            <Switch aria-label="大号带开关文字的开关，已开启" defaultChecked checkedText="开" uncheckedText="关" size="large" />
            <Switch aria-label="大号带符号文字的开关，已开启" defaultChecked checkedText="｜" uncheckedText="〇" size="large" style={{ marginLeft: 5 }} />
        </div>
    );
}
