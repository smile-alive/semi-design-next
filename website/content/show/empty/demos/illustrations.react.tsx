import {
    IllustrationConstruction,
    IllustrationSuccess,
    IllustrationFailure,
    IllustrationNoAccess,
    IllustrationNoContent,
    IllustrationNotFound,
    IllustrationNoResult,
    IllustrationIdle,
    IllustrationIdleDark,
    IllustrationConstructionDark,
    IllustrationSuccessDark,
    IllustrationFailureDark,
    IllustrationNoAccessDark,
    IllustrationNoContentDark,
    IllustrationNotFoundDark,
    IllustrationNoResultDark,
} from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

const emptyStyle = { padding: 30 };
const imageStyle = { width: 150, height: 150 };

export default function EmptyDemo() {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Empty image={<IllustrationSuccess style={imageStyle} />} darkModeImage={<IllustrationSuccessDark style={imageStyle} />} description="创建成功" style={emptyStyle} />
            <Empty image={<IllustrationFailure style={imageStyle} />} darkModeImage={<IllustrationFailureDark style={imageStyle} />} description="加载失败" style={emptyStyle} />
            <Empty image={<IllustrationNoAccess style={imageStyle} />} darkModeImage={<IllustrationNoAccessDark style={imageStyle} />} description="没有权限" style={emptyStyle} />
            <Empty image={<IllustrationNoContent style={imageStyle} />} darkModeImage={<IllustrationNoContentDark style={imageStyle} />} description="暂无内容，请添加" style={emptyStyle} />
            <Empty image={<IllustrationNotFound style={imageStyle} />} darkModeImage={<IllustrationNotFoundDark style={imageStyle} />} description="页面404" style={emptyStyle} />
            <Empty image={<IllustrationNoResult style={imageStyle} />} darkModeImage={<IllustrationNoResultDark style={imageStyle} />} description="搜索无结果" style={emptyStyle} />
            <Empty image={<IllustrationConstruction style={imageStyle} />} darkModeImage={<IllustrationConstructionDark style={imageStyle} />} description="建设中" style={emptyStyle} />
            <Empty image={<IllustrationIdle style={imageStyle} />} darkModeImage={<IllustrationIdleDark style={imageStyle} />} description="神游四方" style={emptyStyle} />
        </div>
    );
}
