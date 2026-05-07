# Debian 12 VPS 配置 IPv4 + IPv6 的踩坑与总结

很多新手在使用 VPS 时都会遇到这样的问题：服务商后台分配了 IPv4 和一个整段的 `/64` IPv6，但系统里只有 IPv4 或只有 IPv6，或者面板显示“无 IP”。下面用一步步记录的方式，分享一台 Debian 12 VPS 从“无网络信息”到顺利启用 IPv4 + IPv6 的过程，希望能给刚入门的朋友一些参考。

## 前置准备：获取服务商提供的信息

在开始操作之前，需要先从服务商管理面板查看分配给你的网络信息：

- **IPv4 地址**和**子网掩码**（例如 `xxx.xxx.xxx.xxx/24`），以及对应的默认网关。
- **IPv6 段**，通常是一个 `/64`，例如 `2a00:abcd:1234:5678::/64`。请注意，这是一整个网段，而不是可以直接使用的地址。

我们的目标是从这个 IPv6 段中任选一个地址（例如 `2a00:abcd:1234:5678::1/64`）来分配给 VPS。不要直接把 `/64` 网段当成地址使用，这是很多新手容易犯的错误。

## 第一步：连接 VPS 并识别网卡

通过 SSH 或类似工具登录 VPS。首先确认服务器的网络接口名称：

```bash
ip -o link
```

输出内容类似于：

```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether aa:bb:cc:dd:ee:ff brd ff:ff:ff:ff:ff:ff
```

这里的 `eth0` 就是网卡名称。如果你看到的是 `enp1s0`、`ens3` 等其他名称，请根据实际情况替换下面的配置。

## 第二步：查看并备份原始 netplan 配置

Debian 12 使用 netplan 作为网络配置工具，默认配置文件通常位于 `/etc/netplan/50-cloud-init.yaml`。先查看内容：

```bash
cat /etc/netplan/50-cloud-init.yaml
```

如果文件中只有类似

```yaml
network:
    ethernets:
        eth0:
            dhcp4: true
    version: 2
```

说明系统通过 DHCP 自动获取 IPv4 地址。这对需要静态 IP 的 VPS 来说不合适，可以使用 `cp` 命令备份原文件：

```bash
sudo cp /etc/netplan/50-cloud-init.yaml /etc/netplan/50-cloud-init.yaml.bak
```

## 第三步：禁用 cloud-init 的网络配置

很多云镜像通过 cloud-init 自动生成 netplan 配置。如果不禁用，重启后可能会覆盖自定义配置。官方指导建议在 `/etc/cloud/cloud.cfg.d/` 下创建一个配置文件来禁用网络【538205162275225†L11-L18】：

```bash
sudo mkdir -p /etc/cloud/cloud.cfg.d
sudo tee /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg > /dev/null <<'EOF'
network: {config: disabled}
EOF
```

该文件会让 cloud-init 放弃自动生成网络配置。

## 第四步：编写统一的 IPv4 + IPv6 配置

删除之前为了 IPv6 临时创建的 `/etc/netplan/90-ipv6.yaml`（如果有）：

```bash
sudo rm -f /etc/netplan/90-ipv6.yaml
```

然后创建或覆盖 `/etc/netplan/50-cloud-init.yaml`，将 IPv4 和 IPv6 写在同一个网卡下。在此示例中假设你的 IPv4 地址是 `192.0.2.10/24`，网关是 `192.0.2.1`，IPv6 选的是 `2001:db8:abcd:1234::1/64`，网关是 `fe80::1`。

```bash
sudo tee /etc/netplan/50-cloud-init.yaml > /dev/null <<'EOF'
network:
  version: 2
  ethernets:
    eth0:
      match:
        macaddress: aa:bb:cc:dd:ee:ff
      set-name: eth0
      addresses:
        - 192.0.2.10/24
        - 2001:db8:abcd:1234::1/64
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
          - 2606:4700:4700::1111
          - 2001:4860:4860::8888
      routes:
        - to: default
          via: 192.0.2.1
        - to: default
          via: fe80::1
          on-link: true
EOF
```

几点说明：

- `match.macaddress` 可以使用网卡的 MAC 地址，也可以省略，只保留 `set-name: eth0` 即可。
- `addresses` 包含 IPv4 和 IPv6 两行。
- `nameservers.addresses` 设置 DNS。可以同时写 IPv4 和 IPv6 DNS。
- IPv6 默认网关 `fe80::1` 是链路本地地址，需要加 `on-link: true` 才能生效。

将 DHCP 改为静态配置的过程和这个步骤类似，在网上很多教程中都有介绍【538205162275225†L33-L44】。

## 第五步：修复文件权限并应用配置

Netplan 要求配置文件的权限要严格。执行以下命令修改权限：

```bash
sudo chmod 600 /etc/netplan/*.yaml
```

然后生成并应用配置：

```bash
sudo netplan generate
sudo netplan apply
```

执行 `netplan apply` 时，可能会看到类似

```
Cannot call openvswitch: ovsdb-server.service is not running.
```

这是由于系统安装了 Open vSwitch 相关包，但服务没有启动。对于普通 VPS，这个提示可以忽略，不影响 IP 生效。

## 第六步：验证地址和路由

配置完成后，用以下命令确认 IPv4 和 IPv6 是否加载：

```bash
ip addr show eth0
ip route
ip -6 route
```

你应该看到 IPv4 和 IPv6 地址都已分配，并且有默认路由。例如：

```
inet 192.0.2.10/24
inet6 2001:db8:abcd:1234::1/64
...
default via 192.0.2.1 dev eth0
...
default via fe80::1 dev eth0 onlink
```

## 第七步：处理 DNS 解析问题

有时候配置 IP 后发现 `ping` 可以通，但解析域名失败，例如：

```
curl -4 example.com
curl: (6) Could not resolve host: example.com
```

这可能是 `/etc/resolv.conf` 丢失或者指向了不存在的文件。可以手动修复：

```bash
sudo rm -f /etc/resolv.conf
sudo tee /etc/resolv.conf > /dev/null <<'EOF'
nameserver 1.1.1.1
nameserver 8.8.8.8
nameserver 2606:4700:4700::1111
nameserver 2001:4860:4860::8888
EOF
```

修改后再测试：

```bash
curl -4 ip.sb
curl -6 ip.sb
```

如果返回的就是你的 IPv4 和 IPv6 地址，说明 DNS 已经正常。

## 第八步：重启面板/服务并总结

如果你使用了管理面板（如 x-ui），在网络配置和 DNS 都正确后，可以重启面板服务：

```bash
sudo systemctl restart x-ui
```

然后刷新面板，一般会正确显示 IPv4 和 IPv6 地址。如果面板依赖外部接口获取位置信息，请确保 DNS 已经能解析外部域名。

### 小结

通过以上步骤，我们实现了以下目标：

1. 从服务商界面获取 IPv4、IPv6 配置信息，并明白 IPv6 的 `/64` 是一个网段，需要自选地址。
2. 使用 `ip link` 确认网卡名称，对症下药修改 netplan 配置。
3. 禁用 cloud-init 网络配置，防止重启覆盖。
4. 在 netplan 中同时添加 IPv4 和 IPv6 地址、网关和 DNS，并设置合适的权限。
5. 应用配置后验证地址、路由和连通性，忽略某些非致命的系统提示。
6. 修复 DNS 文件缺失导致的域名解析失败，确保外网访问正常。

整个过程并不复杂，但每一步都需要细心。例如，选择 IPv6 地址时不要使用 `/64` 网段本身；修改 netplan 后先 `generate` 再 `apply`；当出现权限或 Open vSwitch 警告时要分辨出问题的本质。希望这篇记录能帮助你顺利开启 VPS 的 IPv4 和 IPv6 功能。
