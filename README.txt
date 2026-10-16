旅人手札 v0.21.0 应用源码（数据版本10）

保留原 work/ 与 outputs/ 路径结构。所有命令从解压后的“源码”目录执行。
现成 HTML 可以直接本地打开；APK/Windows包见独立交付文件，运行不需源码环境。

HTML：python work/assemble-v13.py
构建器使用不可变的 work/prototype-v012.html，依次加入 v13、v134、v14、v16、v17、v18、v19、v20、v21 模块。
请修改对应模块，勿直接修改生成的HTML。assemble同时从obr-roll-core生成共用骰子解析器。

枭熊：在 outputs/owlbear/src 执行 npm install --ignore-scripts，然后 npm run build。
SDK版本由package.json固定；普通使用不需npm。服务器仅用Python标准库。
obr-token-sync.mjs为本项目实现的Stat Bubbles适配器。src/vendor/suite19 为改编自 FullPeople/obr-suite 的GPL骰子动画及音效代码，保留对应源码和许可证。

Android：需要JDK21及Android SDK36；按实际电脑调整build-android.py的JDK路径。
python work/setup-android-sdk.py 准备官方SDK；固定ZXing3.5.3的jar和许可证已在work/android-deps。
python work/build-android.py 构建正式APK；默认会新建属于你自己的发布密钥。
原签名私钥、口令不随源码分发，新密钥生成的APK不能覆盖本项目旧签名APK。
相机权限在用户点扫码后申请；扫码和私网传输使用原生接口，无需Google服务。

Windows：需要.NET Framework C#编译器、Pillow和WebView2 SDK DLL，以及可携Python。
python work/setup-windows-deps.py 获取官方依赖（此脚本默认查当时稳定版本）。
本次已验证的依赖版本和URL见work/windows-deps/dependency-versions.json。
python work/build-windows.py 构建64位Windows桌面程序。
完整版的WebView2官方离线安装器体积约204MiB，不放入源码包。
如需构建完整版，从交付的Windows完整版复制安装器到
work/windows-deps/WebView2Installer/MicrosoftEdgeWebView2RuntimeInstallerX64-complete.exe。
哈希必须与work/v16-runtime-info.json一致，否则构建器拒绝附带；不复制则为轻量版。
官方重新下载地址：https://go.microsoft.com/fwlink/?linkid=2124701
微软后续替换下载文件时应重新校验Microsoft Authenticode并更新本地元数据，不能跳过校验。
应用只在用户点击安装按钮后运行经过Microsoft签名验证的安装器。

测试：work/qa-v19-*.cjs、*.py和verify-v19.py；当前回归报告附在work/。
部分测试路径指向本机Edge、Playwright、Android模拟器，需按自己环境调整。
Android扫码已用最终正式APK在Android15模拟器的真实Camera2画面验证。
枭熊以SDK模拟房间验证；尚未验收实体手机及已登录的真实多人枭熊房间。
扫码为一次性数据快照：电脑出示二维码，APK扫码后应用内预览确认；不是持续后台同步。
棋子同步以角色卡为来源，绑定后单向更新HP、最大HP、临时HP与AC。

不含：签名私钥、口令、浏览器/应用数据、测试角色记录、SDK/模拟器大文件及研究缓存。
第三方许可证保留于outputs/及work/android-deps等对应目录。

更新器与镜像设置：见 docs/更新与镜像下载.md。更新私钥不随源码提供。

GitHub Pages自动发布：main分支推送插件源码后，Actions按package-lock构建并发布静态白名单；两个安装地址保持不变。详见docs/v0.21安装与使用方法.md。
