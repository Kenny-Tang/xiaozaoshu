在 CentOS（例如 CentOS 7 或 CentOS 8）中安装 **Maven**（Apache Maven）的方法主要有两种：使用包管理器（简单但可能版本较旧），或者手动安装（推荐，可获得最新版）。

---

## ✅ 推荐方式：手动安装最新版 Maven

### 📌 步骤 1：下载 Maven 最新版本

1. 打开 [Maven 官网下载页](https://maven.apache.org/download.cgi)
2. 找到版本号（如 `3.9.6`），右键复制 tar.gz 链接：

```bash
wget https://downloads.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
```

---

### 📌 步骤 2：解压并移动到系统目录

```bash
tar -zxvf apache-maven-3.9.6-bin.tar.gz
sudo mv apache-maven-3.9.6 /opt/maven
```

---

### 📌 步骤 3：配置环境变量

编辑 `/etc/profile`（全局）或 `~/.bash_profile`（当前用户）：

```bash
sudo vi /etc/profile
```

在末尾添加以下内容：

```bash
export M2_HOME=/opt/maven
export PATH=$M2_HOME/bin:$PATH
```

然后执行：

```bash
source /etc/profile
```

---

### 📌 步骤 4：验证安装

```bash
mvn -v
```

输出类似：

```
Apache Maven 3.9.6
Java version: 1.8.0_xx, vendor: Oracle Corporation
...
```

---



## 下面是一份适用于 **CentOS 7/8 的 Maven 一键安装脚本**
支持：

* 自动下载指定版本（默认 Maven 3.9.6）
* 解压到 `/opt/maven`
* 自动配置系统环境变量（`/etc/profile`）
* 自动执行 `source` 生效

---

## ✅ 一键安装脚本内容（文件名建议为 `install-maven.sh`）

```bash
#!/bin/bash

# 设置版本号和安装目录
MAVEN_VERSION=3.9.6
MAVEN_DIR=/opt/maven
MAVEN_DOWNLOAD_URL=https://downloads.apache.org/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz

# 下载 Maven 安装包
echo "📦 正在下载 Maven ${MAVEN_VERSION}..."
wget -q $MAVEN_DOWNLOAD_URL -O /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz

# 解压并移动
echo "📂 正在解压..."
tar -zxf /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /tmp
sudo rm -rf $MAVEN_DIR
sudo mv /tmp/apache-maven-${MAVEN_VERSION} $MAVEN_DIR

# 配置环境变量（写入 /etc/profile）
echo "⚙️ 正在配置环境变量..."
sudo sed -i '/M2_HOME/d' /etc/profile
sudo sed -i '/MAVEN_HOME/d' /etc/profile
sudo sed -i '/\/opt\/maven\/bin/d' /etc/profile

sudo bash -c "cat >> /etc/profile" << EOF

# Maven environment
export M2_HOME=${MAVEN_DIR}
export MAVEN_HOME=${MAVEN_DIR}
export PATH=\$M2_HOME/bin:\$PATH
EOF

# 立即生效
echo "🔁 正在使环境变量生效..."
source /etc/profile

# 验证结果
echo "✅ Maven 安装完成，版本为："
mvn -v
```

---

## ✅ 使用方法

1. **保存为文件**：

   ```bash
   vi install-maven.sh
   ```

   粘贴脚本内容后保存退出。

2. **赋予执行权限并运行**：

   ```bash
   chmod +x install-maven.sh
   sudo ./install-maven.sh
   ```

---

## 🎉 安装成功后你将看到：

```
Apache Maven 3.9.6
Java version: 1.8.0_xx
...
```

