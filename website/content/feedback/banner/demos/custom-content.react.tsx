import { Banner } from '@fibrae/semi-ui-react';

export default function BannerDemo() {
    return (
        <div style={{ width: 500, padding: 20, border: '1px solid var(--semi-color-border)' }}>
            <Banner fullMode={false} title="Title" type="warning" bordered description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat">
                <div className="semi-modal-footer">
                    <button className="semi-button semi-button-tertiary semi-button-light" type="button">
                        No, thanks.
                    </button>
                    <button className="semi-button semi-button-warning" type="button">
                        Sounds great!
                    </button>
                </div>
            </Banner>
            <br />
        </div>
    );
}
