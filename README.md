# [苏卡卡的好伙伴](https://blog.skk.moe/links/)

所以，你是想和大尾巴苏卡卡交换友链嘛w~

## 基本要求

- 首先，友链友链，先友后链嘛。所以最好是苏卡卡比较眼熟的人呢。
- 网站的域名是很重要的，如果是免费域名的话就请不要来啦。
  - 免费域名 **包括但不限于** 下述定义：
    - 由 Freenom 公司运营的免费域名后缀，如 `.ml`、`.tk`
    - 由 Joshua Anderson 运营的 Afraid FreeDNS 提供的免费子域名
    - 其他不包含在 Public Suffix List 中的 **免费子域名** 服务
    - 由于下述免费子域名服务拒绝提交至 Public Suffix List，根据第三条的定义将会被拒绝：
      - `oschina.io`
      - `gitee.io`
      - `coding.me`
      - `coding.io`
      - `coding-pages.com`
  - 免费域名 **不包括** 下述定义：
    - 向 Freenom 公司付费购买的 `.ml`、`.tk` 等域名
    - 由 Automattic 公司运营的 `wordpress.com` 在线博客服务
    - 「我的磨」`wodemo.com` 在线内容托管服务
    - 其他任何包含于 Public Suffix List 的免费子域名服务，如 `github.io`，`gitlab.io`，`now.sh` 等
- 苏卡卡喜欢有 **实质性内容** 的网站。充斥着各种采集、洗稿的内容、几乎没有原创的网站，苏卡卡是很讨厌的。
  - 网站和博客可以长草，不要滥竽充数
  - 网站内容是否符合「实质性」的最终解释权归苏卡卡所有~
- 还有一点，当然是要会用 Git 和 GitHub 啦。

## 如何交换友链

如果你认为自己符合上面的要求，那么就欢迎来和苏卡卡交换友链啦。

- 将苏卡卡的网站添加到自己的友链中：
  - 站点名称：`苏卡卡的有底洞` 或 `Sukka's Blog`
    - 非强制，你也可以用你自己喜欢的名字哒
  - URL：`https://skk.moe` 或 `https://blog.skk.moe`
    - 两个 URL 选一个啦
  - Slogan：`童话只美在真实却从不续写`
    - 非强制，你可以自己选择想要展示的文字哒
  - Logo
    - Favicon：
      - [`32x32`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/favicon/favicon-32x32.png)
      - [`192x192`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/favicon/android-chrome-192x192.png)
      - [`512x512`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/favicon/android-chrome-512x512.png)
      - [svg](https://cdn.jsdelivr.net/npm/skx@0.2.3/favicon/safari-pinned-tab.svg)
    - 头像：
      - [`36x36`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/avatar/36x36.png)
      - [`96x96`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/avatar/96x96.png)
      - [`144x144`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/avatar/144x144.png)
      - [`192x192`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/avatar/192x192.png)
      - [`512x512`, png](https://cdn.jsdelivr.net/npm/skx@0.2.3/avatar/512x512.png)
    - 根据自己的友链页面风格和样式、从上面的图中任选一个啦。当然如果你的友链页面没有放图片的地方、就不用管 Logo 了，没关系的说~
  - [Banner](https://cdn.jsdelivr.net/npm/skx@0.2.3/img/banner.png)
    - 如果你的友链页面是卡片式、且支持自定义背景的话，可以用这幅 Banner。

- 准备一个自己站点的 Logo
  - Logo 的要求是中心对称图形，如正方形、圆形、菱形等
  - 长度与宽度应小于 `512px`
  - 使用常见图形文件格式（如 `png`、`jpg`、`svg`、`ico` 等，不包括 `tiff`、`webp`、`icns`）。
  - 文件大小应小于 1 MiB
  - **原则上** Logo 应符合 Gravater `G` 分级要求（即适合在任何网站上展示给任何年龄段的任何人）
    - 原则是什么？原则是有例外的。—— 罗翔，「厚大法考」

- 准备需要展示的站点名称，长度应小于 16 个半角字符或 8 个全角字符，否则在展示时可能会被截断
  - **原则上** 站点名称应适合在任何网站上展示给任何年龄段的任何人

- 准备一条 Slogan，长度建议小于 28 个半角字符或 14 个全角字符，否则在展示时可能会被截断
  - **原则上** Slogan 应适合在任何网站上展示给任何年龄段的任何人

- 在 GitHub 上 Fork 这个仓库
- 在 `src/img` 下提交 Logo
  - 文件名格式为 `[domain].[format]`，如 `example.com.png`，`blog.example.com.jpg`

- 修改 `src/links.yml` 文件。
  - 按照如下格式将你的网站信息添加到 `links.yml` 文件中：
    ```yaml
    "站点名称": # 请使用双引号包裹
      url: https://example.com # 你的网站的 URL
      img: example.com.png # Logo 的文件名
      text: "Hello, World" # Slogan，请使用双引号包裹

- 完成上述步骤后，请新建一个 Pull Request。
- 当 Pull Request 被 Review 并被通过、合并后，你的网站将会在 12 个小时内显示在 [苏卡卡的友链页面](https://blog.skk.moe/links/)。
