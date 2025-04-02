
---

## **方式 1：手动安装 Docker RPM 包（推荐）**
> **适用于**：内网 YUM 源不可用，但可以下载 RPM 包的情况（你已经尝试过）。

- 在 **有网服务器** 下载 Docker RPM 包：
  ```bash
  yum install --downloadonly --downloaddir=. docker-ce docker-ce-cli containerd.io
  ```
- 将 RPM 文件传输到 **内网服务器** 并安装：
  ```bash
  yum localinstall -y *.rpm
  ```

---

## **方式 2：使用离线 Tar 包安装 Docker**
> **适用于**：无法使用 YUM，但可以手动拷贝二进制文件的情况。

### **步骤 1：在有网机器下载 Docker 二进制文件**
在 **可联网的机器** 上执行：
```bash
curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-24.0.7.tgz -o docker.tgz
```
> 请根据实际版本替换 `docker-24.0.7.tgz`，可前往 [Docker 官方下载](https://download.docker.com/linux/static/stable/x86_64/) 获取最新版本。

---

### **步骤 2：解压并拷贝到内网服务器**
将 `docker.tgz` 复制到 **内网服务器**，然后解压：
```bash
tar -xvzf docker.tgz
sudo cp docker/* /usr/bin/
```

---

### **步骤 3：创建 systemd 服务**
手动创建 `docker.service`：
```bash
cat <<EOF | sudo tee /etc/systemd/system/docker.service
[Unit]
Description=Docker Service
After=network.target

[Service]
ExecStart=/usr/bin/dockerd
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

启动 Docker 并设置开机自启：
```bash
systemctl daemon-reload
systemctl enable --now docker
```

---

## **方式 3：利用已有的 Containerd 运行 Docker**
> **适用于**：已有 **containerd** 运行的内网环境，可以直接运行 Docker。

如果你的环境已经有 `containerd`，可以使用 `nerdctl` 代替 `docker`，或者安装 **Docker CLI** 并配置 `containerd` 作为后端：
```bash
yum install -y docker-ce-cli
```
然后手动配置 Docker CLI 连接到 `containerd`。

---

## **方式 4：利用已有 Kubernetes 运行 Docker 容器**
> **适用于**：你的内网有 **Kubernetes** 集群，可以直接拉取内部镜像，而无需安装 Docker。

如果你的 **内网有 Kubernetes**，可以直接用 `kubectl run` 或 `kubectl create deployment` 来运行容器，而无需安装 Docker。

---

### **总结**
| **方式** | **适用场景** | **优点** | **缺点** |
|----------|------------|----------|----------|
| **RPM 包安装（方式 1）** | 适用于支持 YUM 安装的内网 | 易于维护，官方推荐 | 需要下载多个 RPM 包 |
| **Tar 包二进制安装（方式 2）** | 适用于无法使用 YUM，但可以拷贝文件 | 不依赖 YUM，轻量级 | 需要手动管理服务 |
| **Containerd + Docker CLI（方式 3）** | 适用于已有 Containerd 运行环境 | 兼容性好 | 需要手动配置 |
| **Kubernetes 部署（方式 4）** | 适用于已有 Kubernetes 集群 | 无需单独安装 Docker | 仅适用于 K8S |
