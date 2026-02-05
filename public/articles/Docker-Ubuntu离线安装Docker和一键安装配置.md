**Ubuntu 使用离线 Tar 包安装 Docker**，不走 `.deb` 包，直接用 **官方 tar.gz 压缩包**来安装，
这种方法更简单、纯净，而且 **几乎所有 Linux 系统**都适用（包括 Ubuntu / CentOS / Debian / 其他）。

整理以下详细步骤：

---

# ✨ Ubuntu 使用离线 Tar 包安装 Docker（纯净版）

---

## 1. 在有外网的机器上下载 Docker 二进制 tar 包

访问官方地址：

* 官方下载页：[https://download.docker.com/linux/static/stable/](https://download.docker.com/linux/static/stable/)

你可以根据架构下载，比如 Ubuntu 常用的是 `x86_64`（也叫 `amd64`）。

比如下载 docker-28.0.4.tgz（版本举例）：

```bash
wget https://download.docker.com/linux/static/stable/x86_64/docker-28.0.4.tgz
```

下载完成后，会得到一个像这样的文件：

```bash
docker-28.0.4.tgz
```

---

## 2. 把下载好的 `.tgz` 文件拷贝到内网 Ubuntu 机器

可以用 U盘、scp、rsync等方式，拷贝到比如 `/opt/docker` 目录。

```bash
mkdir -p /opt/docker
cp docker-28.0.4.tgz /opt/docker/
cd /opt/docker/
```

---

## 3. 解压 Docker tar 包

解压到 `/usr/local/bin/`（Docker要求可执行文件在 PATH 目录里）：

```bash
tar -xvzf docker-28.0.4.tgz
sudo cp docker/* /usr/local/bin/
```

解压后，`docker`、`dockerd`、`containerd`、`runc` 等命令都会在 `/usr/local/bin/` 目录里。

✅ 到这一步，Docker 的核心程序已经部署好了。

---

## 4. 配置 Docker Systemd 启动文件（推荐）

Docker需要一个 systemd 服务文件来守护进程运行。
你可以自己写，或者直接拷贝官方模板。

新建 Systemd 服务文件：

```bash
sudo mkdir -p /etc/systemd/system/
sudo tee /etc/systemd/system/docker.service <<-'EOF'
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always
StartLimitBurst=3
StartLimitInterval=60s
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity

[Install]
WantedBy=multi-user.target
EOF
```

然后重新加载 systemd 配置：

```bash
sudo systemctl daemon-reload
```

启动 Docker：

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

检查状态：

```bash
sudo systemctl status docker
```

如果看到 `Active: active (running)`，就是成功了！

---

## 5. 验证 Docker 安装

执行：

```bash
docker version
docker info
```

能正常输出客户端和服务器端信息。

---

# 🔥 总结一下超简洁版

| 步骤                       | 命令                                                                                |
| :----------------------- | :-------------------------------------------------------------------------------- |
| 下载 Docker tar.gz         | `wget https://download.docker.com/linux/static/stable/x86_64/docker-xx.xx.xx.tgz` |
| 拷贝到内网机器                  | `scp/cp/rsync`                                                                    |
| 解压并复制到 `/usr/local/bin/` | `tar -xzvf docker-xx.xx.xx.tgz && cp docker/* /usr/local/bin/`                    |
| 写 systemd 配置文件           | `/etc/systemd/system/docker.service`                                              |
| 启动 docker                | `systemctl start docker`                                                          |

---

# ⚡️优缺点对比

| 优点                       | 缺点                  |
| :----------------------- | :------------------ |
| 不需要 .deb，能在各种 Linux 系统安装 | 没有包管理，手动升级/卸载       |
| 安装极快，简单                  | 需要自己配置 systemd 启动文件 |
| 超纯净，没有杂七杂八依赖             | 日后可能要自己管理升级版本       |

---

# 💬 小提示

* **升级 Docker**：下载新版 tar 包，覆盖 `/usr/local/bin/` 目录里的文件就行。
* **卸载 Docker**：只要删除 `/usr/local/bin/docker*`、`/etc/systemd/system/docker.service`，清理容器数据 `/var/lib/docker/`。
* **Docker Rootless模式**：也可以用这种安装方式，方便在无 root 权限环境运行。

---

**Ubuntu 离线安装 Docker 的一键启动脚本**，
拷贝 `.tgz`，执行 `.sh` 脚本，自动完成安装 ➔ systemd配置 ➔ 启动 Docker！

---

# 🛠️ Ubuntu 离线 Docker 安装一键脚本 (`install-docker.sh`)

```bash
#!/bin/bash

set -e

# 配置
DOCKER_TAR="docker-28.0.4.tgz"    # 这里写你的 docker 离线包文件名
INSTALL_DIR="/usr/local/bin"
SERVICE_FILE="/etc/systemd/system/docker.service"

# 检查是否有 tar 包
if [ ! -f "$DOCKER_TAR" ]; then
  echo "❌ 找不到 $DOCKER_TAR，请确认 tgz 包已经放在当前目录"
  exit 1
fi

echo "🚀 开始解压 Docker..."
tar -xvzf "$DOCKER_TAR"

echo "🚀 拷贝 Docker 执行文件到 $INSTALL_DIR..."
sudo cp docker/* "$INSTALL_DIR/"

echo "🚀 写入 systemd 服务文件..."
sudo tee "$SERVICE_FILE" > /dev/null <<-'EOF'
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always
StartLimitBurst=3
StartLimitInterval=60s
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity

[Install]
WantedBy=multi-user.target
EOF

echo "🚀 重新加载 systemd 守护进程..."
sudo systemctl daemon-reload

echo "🚀 启动 Docker 服务..."
sudo systemctl enable docker
sudo systemctl start docker

echo "✅ Docker 已经启动完成！当前状态："
sudo systemctl status docker --no-pager

echo "🎯 检查 docker 版本："
docker version

```

---

# ✨ 使用方法

1. 把 `docker-28.0.4.tgz` 和这个脚本 `install-docker.sh` 放到同一个目录，比如 `/opt/docker/`
2. 给脚本加执行权限：

   ```bash
   chmod +x install-docker.sh
   ```
3. 执行脚本安装 Docker：

   ```bash
   ./install-docker.sh
   ```

---

# 🔥 效果

执行后自动：

* 解压 tar 包
* 拷贝 docker 文件到 `/usr/local/bin`
* 写 systemd docker.service
* 启动并设置开机自启
* 显示 Docker 当前运行状态

整个过程不需要手动干预，一步到位。
适合批量部署、内网无人值守安装。

---

# 💬 温馨提醒

* 记得把 `DOCKER_TAR="docker-28.0.4.tgz"` 修改成你实际下载的版本文件名，比如 `docker-25.0.3.tgz`。
* 这个脚本默认安装到 `/usr/local/bin`，如果你有特别需求（比如放到 `/opt/docker/bin/`），可以改脚本里的 `INSTALL_DIR`。
