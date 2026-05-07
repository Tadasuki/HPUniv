# 国行一加 8（IN2010）刷国际版 OxygenOS 经验记录：从 ColorOS 到 OOS 13.1

> 设备：OnePlus 8 国行版  
> 型号：IN2010  
> 目标：刷入国际版 OxygenOS，并升级到 OxygenOS 13.1  
> 最终路线：备份数据 → 解锁 Bootloader → 准备 OnePlus 8 IN21AA MSM 包 → 进 9008 使用 MSM 刷入 OxygenOS 11 国际版底包 → 开机确认 OOS 11 正常 → 使用 Full OTA 本地升级到 OOS 13.1

这篇文章不是一篇“十分钟无脑刷机教程”，而是一篇我从国行一加 8 折腾到国际版 OxygenOS 的完整经验整理。

一加 8 这台机器本身很有意思：硬件够用，手感也不错，但国行系统和国际版系统之间的差异，会让很多人想把它刷成 OxygenOS。理论上这件事并不复杂，但如果从较新的国行 ColorOS 直接跨区刷国际版 OTA，很容易遇到验证失败、bootloop、EDL、Sahara 等一系列让人血压升高的问题。

我最后总结出来的稳定路线是：

```text
备份数据
→ 解锁 Bootloader
→ 准备 OnePlus 8 IN21AA MSM 包
→ 进 9008 使用 MSM 刷入 OxygenOS 11 国际版底包
→ 开机确认 OxygenOS 11 正常
→ 使用 Full OTA 本地升级到 OxygenOS 13.1
```

这条路线的核心思想是：**不要试图在国行系统里硬塞国际版 OTA，而是先用 MSM 把底层刷成一个干净的国际版 OxygenOS 基线，再从这个基线正常升级。**

---

## 0. 写在前面：风险说明

刷机前先把丑话说在前面。

这套流程会清空数据，也存在变砖风险。尤其是一加 8 是 A/B 分区、动态分区设备，Android 12/13 之后系统分区结构更复杂。如果随便提取 `payload.bin` 然后手动刷分区，很容易出现系统、vendor、modem、bootloader 固件不匹配，最终卡 logo、进 recovery，甚至需要 9008 救砖。

所以，如果你也准备照着做，至少要接受以下几点：

- 所有数据都会被清空。
- Bootloader 解锁会清空数据。
- MSM 刷机会清空数据。
- 刷错机型包可能导致无法开机。
- OnePlus 8、OnePlus 8 Pro、OnePlus 8T 的包不能混用。
- 国行 IN2010 刷国际版后，设置里型号仍可能显示 IN2010，这是正常的。
- 不要在系统不稳定或分区不确定的状态下回锁 Bootloader。

如果你只想“保资料、不折腾、马上用”，这条路不适合你。

---

## 1. 我的设备初始状态

我手里的机器是国行一加 8：

```text
设备：OnePlus 8
型号：IN2010
原系统：国行 ColorOS
原 Android 版本：13
原版本号：IN2010_11.F.74_2740_202406060040
```

目标是刷成国际版 OxygenOS，最终希望能运行 OxygenOS 13.1。

一加 8 的几个关键代号和版本名需要先搞清楚：

| 项目 | 含义 |
|---|---|
| IN2010 | 国行 OnePlus 8 |
| IN2015 | 北美/Global 常见机型标识 |
| IN21AA | OnePlus 8 国际版 / Global 软件区域 |
| IN21BA | OnePlus 8 欧洲版软件区域 |
| IN21DA | OnePlus 8 印度版软件区域 |
| instantnoodle | OnePlus 8 设备代号 |
| instantnoodlep | OnePlus 8 Pro 设备代号，不能混用 |

这里最容易搞错的是 **OnePlus 8 和 OnePlus 8 Pro**。两者名字很像，包名也很像，但设备代号不同。OnePlus 8 是 `instantnoodle`，OnePlus 8 Pro 是 `instantnoodlep`。多一个 `p`，后果可能就是一晚上睡不着。

---

## 2. 整体思路

一开始我也想走最直接的路线：下载国际版 OxygenOS Full OTA，然后本地升级。

但实际情况是，国行系统会对跨区包做校验。即使这个包本身没坏，也可能在系统更新器里直接提示验证失败。

最终更稳的思路是：

```text
不要从国行系统直接跨区升级
而是先用 MSM 把机器刷成国际版 OxygenOS 11 底包
再从 OOS 11 正常升级到 OOS 13.1
```

这条路线的优点是：

- 避免国行系统更新器拒绝跨区 OTA。
- 避免手动混刷动态分区。
- 用 MSM 一次性写入完整国际版基线。
- 后续升级走系统认可的 Full OTA 路线。

---

## 3. 准备工作

### 3.1 备份数据

刷机第一步永远是备份。

需要备份的内容包括：

- 照片和视频
- 微信聊天记录
- 通讯录
- 短信
- 下载目录
- 文档
- 双因素认证器
- 银行、支付、门禁、公司认证类 App

不要想着“我只是解锁一下 Bootloader，应该不会清数据”。  
会清。  
不要想着“MSM 只是救砖，应该不会清数据”。  
也会清。

### 3.2 准备电脑

这次实际用到了两套环境：

- macOS：adb/fastboot、校验 OTA 包、查看 metadata
- Windows：MSMDownloadTool、Qualcomm 9008 驱动、EDL 刷机

如果你只想走最终推荐路线，可以直接准备 Windows。

Windows 上需要：

- Android Platform-Tools
- OnePlus 或 Google USB 驱动
- Qualcomm HS-USB QDLoader 9008 驱动
- OnePlus 8 IN21AA MSMDownloadTool 包

---

## 4. 解锁 Bootloader

手机进入系统后，先打开开发者选项：

```text
设置
→ 关于手机
→ 连续点击版本号 7 次
→ 返回系统设置
→ 开发者选项
```

打开：

```text
USB 调试
OEM 解锁
```

这里有一个非常经典的坑：**只打开 USB 调试是不够的，必须打开 OEM 解锁。**

如果忘记打开 OEM 解锁，执行：

```bash
fastboot flashing unlock
```

可能会报：

```text
FAILED (remote: 'Flashing Unlock is not allowed')
```

这不是线坏，也不是电脑问题，而是手机系统没有允许解锁。

正确流程是：

```bash
adb reboot bootloader
fastboot devices
fastboot flashing unlock
```

手机屏幕出现确认界面后，用音量键选择解锁，电源键确认。

解锁后手机会清空数据并重启。

---

## 5. 为什么不建议直接刷国际版 Full OTA

我最开始下载的是一个国际版 OxygenOS 13.1 Full OTA 包：

```text
IN2015_11.F.67_2670_202306141209.zip
```

这个包看起来很正规，里面是标准 A/B OTA 结构：

```text
payload.bin
payload_properties.txt
META-INF/
```

查看 metadata 后，可以看到：

```text
android_version=13
display_os_version=13.1
ota-type=AB
pre-device=OnePlus8
product_name=OnePlus8
version_name=IN2015_13.1.0.580(EX01)
```

也就是说，这个包本身没有明显问题，而且确实是 OnePlus 8 的 Android 13.1 Full OTA。

但问题在于：**国行系统更新器不一定允许你用它跨区升级。**

实际结果是：选择 zip 后立刻提示验证失败。

这时不要急着说“包坏了”，也不要立刻开始提取 `payload.bin` 手刷。对一加 8 这种 A/B + 动态分区设备来说，手动刷 payload 里的分区并不等于安全升级。

我后来尝试过手动刷分区，确实进了 bootloop。这部分经历证明了一个道理：**能提取，不代表该手刷；能刷进去，不代表能启动。**

---

## 6. 推荐路线的关键：准备 IN21AA MSM 包

最终更稳的方案是找 OnePlus 8 的国际版 MSM 包。

你需要找的是：

```text
OnePlus 8
IN21AA
Global / International
MSMDownloadTool
Android 11
```

也可以理解为：**OnePlus 8 国际版 OxygenOS 11 EDL 解砖包。**

正确的包解压后一般会看到类似：

```text
MsmDownloadTool V4.0.exe
*.ops
settings.xml
一些 .bin / .mbn / .xml 文件
```

如果解压后只有：

```text
payload.bin
payload_properties.txt
META-INF/
```

那是 OTA 包，不是 MSM 包。

### 千万不要下载错

不要下载：

```text
OnePlus 8 Pro
IN202x
IN11AA / IN11BA / IN11DA
instantnoodlep
```

不要下载：

```text
OnePlus 8T
KB200x
KB05AA
```

不要下载：

```text
T-Mobile IN2017
Verizon IN2019
运营商定制包
```

本机是普通国行 OnePlus 8，目标是普通国际版 OxygenOS，因此应找 OnePlus 8 的 IN21AA 国际版 MSM 包。

---

## 7. 进入 9008 / EDL 模式

MSM 刷机需要手机进入 Qualcomm EDL，也就是常说的 9008 模式。

如果手机还能进 fastboot，可以先试：

```bash
fastboot oem edl
```

但有些机器会返回：

```text
FAILED (remote: 'unknown command')
```

这很正常，说明 bootloader 不支持这个命令。

这时用按键方式进 EDL：

```text
1. 手机关机
2. 按住音量上 + 音量下
3. 插入 Windows 电脑 USB
4. 继续按住 10–20 秒
5. Windows 设备管理器里查看端口
```

成功后，设备管理器里应该出现：

```text
Qualcomm HS-USB QDLoader 9008 (COMxx)
```

注意：EDL 模式下手机屏幕通常是黑的。黑屏不代表死机，反而可能说明已经进了 9008。

如果设备管理器里显示：

```text
QUSB_BULK
Unknown Device
黄色感叹号
```

说明大概率进了 EDL，但驱动没装好，需要重新安装 Qualcomm 9008 驱动。

---

## 8. 使用 MSMDownloadTool 刷入 OxygenOS 11 国际版底包

进入 9008 后，打开 MSMDownloadTool。

建议：

```text
右键 MsmDownloadTool V4.0.exe
→ 以管理员身份运行
```

如果有登录界面，一般选择：

```text
User Type: Others
Username 留空
Password 留空
Next
```

进入主界面后，查看是否识别到 COM 口。

如果工具里有 Target 选项，国际版通常应选择：

```text
O2
```

刷机流程大致如下：

```text
1. 打开 MSMDownloadTool
2. 选择正确 Target
3. 手机进入 9008
4. 点击 Enum
5. 确认出现 COM 口
6. 点击 Start
7. 等待刷机完成
8. 手机自动重启
```

过程中不要拔线，不要动手机，不要让电脑休眠。

### 常见错误

#### unsupported Target H2

如果出现：

```text
unsupported Target H2
```

说明当前包或目标与设备区域不匹配。国行机可能被识别为 H2，而国际版工具可能需要切到 O2。此时可以在 MSM 工具里尝试 Target 选择 O2。

#### Sahara 通信失败

如果出现：

```text
Sahara 通信失败
PBL: 6
```

通常是 EDL 握手失败，可能和以下因素有关：

- 9008 没保持住
- USB 线不稳定
- USB 口不稳定
- 驱动问题
- MSM 包不完全匹配
- Windows 环境问题

经验上可以尝试：

- 换 USB 2.0 口
- 换数据线
- 不用 USB Hub
- 管理员运行 MSM
- 清理 MSM 日志
- 先打开 MSM，再让手机进 9008
- COM 口一出现立刻点 Start
- 点 Start 后继续按住音量键几秒

如果手机黑屏无反应，先去设备管理器看是否其实已经在 9008。EDL 黑屏是正常的。

---

## 9. MSM 成功后的状态

MSM 成功后，手机会重启并进入 OxygenOS 11。

我的机器成功后显示：

```text
设备名称：OnePlus 8
Android 版本：11
版本号：Oxygen OS 11.0.11.IN21AA
型号：IN2010
```

这里有一个点要说明：

**型号仍显示 IN2010 是正常的。**

IN2010 是硬件型号，不会因为刷了国际版系统就变成 IN2015。真正重要的是版本号里的区域，例如：

```text
IN21AA
```

这说明系统已经在国际版 Global 路线上。

进入系统后，先不要急着继续刷，先检查：

- Wi-Fi 是否正常
- SIM 是否正常
- 蓝牙是否正常
- 相机是否正常
- 指纹是否正常
- Google Play 是否正常
- 系统更新是否能打开

如果这些都正常，再进行下一步升级。

---

## 10. 从 OxygenOS 11 升级到 OxygenOS 13.1

完成 MSM 后，系统基线已经变成国际版 OxygenOS 11。

这时就可以用 Full OTA 本地升级到 OxygenOS 13.1。

我使用的包是：

```text
IN2015_11.F.67_2670_202306141209.zip
```

这个包是：

```text
OxygenOS 13.1
Android 13
IN2015 / Global
Full OTA
```

它的 metadata 中显示：

```text
ota-type=AB
pre-device=OnePlus8
product_name=OnePlus8
post-sdk-level=33
version_name=IN2015_13.1.0.580(EX01)
```

按常规保守思路，比较稳的是：

```text
OOS 11
→ OOS 12
→ OOS 13.1
```

但我实际操作中，从：

```text
Oxygen OS 11.0.11.IN21AA
```

直接本地升级：

```text
IN2015_11.F.67_2670_202306141209.zip
```

最终成功进入系统。

这一步的关键是：**此时手机已经不是国行 ColorOS 的更新器环境，而是国际版 OxygenOS 11 的基线。**

同一个 F.67 包，在国行系统里会验证失败；在刷入 IN21AA 国际版底包后，就具备了正常升级的条件。

### 本地升级方式

在 OxygenOS 11 中：

```text
设置
→ 系统
→ 系统更新
→ 右上角齿轮
→ 本地升级
→ 选择 Full OTA zip
```

如果系统没有本地升级入口，可以使用 OnePlus 本地升级 APK 或 Oxygen Updater 辅助调用本地升级。

升级前建议：

```text
电量 60% 以上
Wi-Fi 稳定
备份重要数据
不要 Root
不要装 Magisk
不要回锁 Bootloader
```

---

## 11. 最终成功路线

把这次折腾压缩成一条“顺直路线”，就是：

```text
备份数据
→ 打开 OEM 解锁和 USB 调试
→ 解锁 Bootloader
→ 下载 OnePlus 8 IN21AA MSMDownloadTool 包
→ Windows 安装 Qualcomm 9008 驱动
→ 手机进入 9008 / EDL
→ MSM 刷入 OxygenOS 11.0.11.IN21AA 国际版底包
→ 开机确认 Wi-Fi / SIM / 指纹 / 相机 / Google Play 正常
→ 准备 OnePlus 8 IN2015 / IN21AA OxygenOS 13.1 Full OTA
→ 通过本地升级刷入 Full OTA
→ 成功进入 OxygenOS 13.1
```

如果只给后来者一句建议，那就是：

> 不要在国行系统里硬跨区刷国际版 OTA。先用 MSM 刷一个干净的 IN21AA 国际版底包，再用 Full OTA 升级。

---

## 12. 这次踩过的坑

### 坑 1：忘记打开 OEM 解锁

症状：

```text
Flashing Unlock is not allowed
```

解决：

```text
回系统打开 OEM 解锁
再执行 fastboot flashing unlock
```

### 坑 2：国行系统本地升级国际版 OTA 验证失败

症状：

```text
选择 zip 后立刻验证失败
```

原因：

```text
跨区 OTA 被国行系统更新器拒绝
```

### 坑 3：误以为 payload.bin 可以安全手刷

OTA 包里有 `payload.bin`，并不代表适合手动刷。

尤其是 A/B 动态分区设备，里面可能涉及：

```text
boot
dtbo
recovery
vbmeta
system
vendor
product
odm
system_ext
my_product
my_region
my_stock
...
```

刷一半、漏一半、底层固件不匹配，都可能 bootloop。

### 坑 4：critical partitions 不能随便刷

即使普通 Bootloader 解锁了，也不一定能刷 critical partitions。

可能出现：

```text
Flashing is not allowed for Critical Partitions
```

这类分区包括：

```text
abl
xbl
tz
hyp
keymaster
cmnlib
aop
devcfg
...
```

这些东西不要随便碰。真到了这一步，通常更应该走 MSM。

### 坑 5：EDL 黑屏不是死机

9008 下手机屏幕就是黑的。  
判断是否成功进入 EDL，不是看屏幕，而是看 Windows 设备管理器：

```text
Qualcomm HS-USB QDLoader 9008 (COMxx)
```

### 坑 6：MSM 包必须选对机型

OnePlus 8 的包和 OnePlus 8 Pro、OnePlus 8T 不能混用。

记住：

```text
OnePlus 8：instantnoodle
OnePlus 8 Pro：instantnoodlep
```

---

## 13. 一些个人建议

### 先准备救砖工具，再开始刷机

不要等 bootloop 了才开始找 MSM 包。  
最好一开始就准备好：

- MSMDownloadTool
- Qualcomm 9008 驱动
- 正确的 OnePlus 8 IN21AA 包
- Windows 电脑
- 一根靠谱的数据线

### 不要执着于“直接刷最新包”

手机系统升级不是简单地把版本号堆高。  
大版本升级涉及 boot、vendor、firmware、动态分区结构、校验链。  
直接跨区、跨 Android 大版本刷，成功是运气，失败也正常。

### 不要轻易回锁 Bootloader

尤其是在跨区刷机后，先保持解锁状态。  
等系统稳定运行一段时间，再考虑是否有必要回锁。

如果分区状态不一致，回锁可能直接导致无法开机。

### 能用 MSM 解决的，不要手动混刷分区

MSM 的好处是它会按整套包写入匹配的底层和系统分区。  
手动刷 payload 则很容易把系统刷成“拼装车”。

---

## 14. 总结

这次刷机的最终结论是：

**国行 OnePlus 8 IN2010 可以刷入国际版 OxygenOS，并最终升级到 OxygenOS 13.1。**

但推荐路线不是从国行系统直接刷国际版 OTA，而是：

```text
解锁 Bootloader
→ 9008 / MSM 刷入 IN21AA OxygenOS 11 国际版底包
→ 开机确认正常
→ 本地升级 IN2015 / IN21AA OxygenOS 13.1 Full OTA
```

这条路线虽然看起来多一步 MSM，但实际上更干净、更可控，也更适合从国行 ColorOS 迁移到国际版 OxygenOS。

折腾一圈之后最大的感受是：刷机最怕的不是命令多，而是路线不清楚。  
一旦路线清楚，剩下的就是确认机型、确认包、确认驱动，然后一步一步来。

最后再次提醒：

```text
备份数据
确认机型
确认包名
不要混刷 8 Pro / 8T
不要乱刷 critical 分区
不要急着回锁 Bootloader
```

祝后来者少走弯路，最好不要像我一样先把手机刷到黑屏，再从 9008 里把它捞回来。
