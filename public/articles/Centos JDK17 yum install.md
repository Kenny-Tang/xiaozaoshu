如果在 CentOS 上尝试通过 `yum` 安装 OpenJDK 17 时遇到“没有可用软件包”的错误，可能是因为默认的仓库中不包含该版本。为了解决这个问题，您可以使用 Eclipse Temurin 提供的 RPM 包来安装 OpenJDK 17。([adoptium.net][1])

---

## ✅ 安装 OpenJDK 17（Eclipse Temurin 发行版）

### 📌 步骤 1：添加 Adoptium 的 RPM 仓库

首先，创建一个新的仓库配置文件：

```bash
sudo tee /etc/yum.repos.d/adoptium.repo > /dev/null << EOF
[Adoptium]
name=Adoptium
baseurl=https://packages.adoptium.net/artifactory/rpm/centos/7/$(uname -m)
enabled=1
gpgcheck=1
gpgkey=https://packages.adoptium.net/artifactory/api/gpg/key/public
EOF
```



这将添加 Adoptium 的 RPM 仓库，并启用 GPG 签名验证。([adoptium.net][2])

### 📌 步骤 2：安装 OpenJDK 17

添加仓库后，运行以下命令安装 OpenJDK 17：

```bash
sudo yum install temurin-17-jdk -y
```



这将安装 Eclipse Temurin 提供的 OpenJDK 17。([Red Hat Developer][3])

### 📌 步骤 3：验证安装

安装完成后，您可以通过以下命令验证安装是否成功：

```bash
java -version
```



输出应类似于：

```

openjdk version "17.0.15" 2025-04-29
OpenJDK Runtime Environment Temurin-17.0.15+6 (build 17.0.15+6)
OpenJDK 64-Bit Server VM Temurin-17.0.15+6 (build 17.0.15+6, mixed mode)
```



---

## 🔁 可选：设置默认 Java 版本（如果系统中存在多个版本）

如果您的系统中安装了多个 Java 版本，您可以使用 `alternatives` 命令设置默认版本：

```bash
sudo alternatives --config java
```



系统会列出所有已安装的 Java 版本，您可以根据提示选择默认版本。

---

如果您需要安装其他版本的 OpenJDK（如 11 或 21），只需将上述安装命令中的版本号更改为所需的版本，例如：

```bash
sudo yum install temurin-11-jdk -y
```



有关更多信息，您可以访问 Eclipse Temurin 的官方安装指南：([adoptium.net][4])

🔗 [Eclipse Temurin 安装指南](https://adoptium.net/installation/linux/)

---

## 📚 参考链接
[1]: https://adoptium.net/installation/linux/?utm_source=chatgpt.com "Linux (RPM/DEB/APK) installer packages - Adoptium"
[2]: https://adoptium.net/blog/2022/07/gpg-signed-releases/?utm_source=chatgpt.com "Verifying GPG signatures for Temurin downloads - Adoptium"
[3]: https://developers.redhat.com/products/openjdk/download?utm_source=chatgpt.com "Download the Red Hat Build of OpenJDK"
[4]: https://adoptium.net/installation/?utm_source=chatgpt.com "Install Eclipse Temurin™ | Adoptium"
