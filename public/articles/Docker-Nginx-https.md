如果仅仅是测试和开发使用，在上一篇文章中已经介绍了如何在 Docker 中使用 NGINX 和 HTTP 进行简单的 Web 服务。

在 **CentOS** 上获取免费的 HTTPS 证书（如 Let's Encrypt），推荐使用 **Certbot 工具**。以下是完整步骤，适用于大多数 CentOS 7/8 环境。

---

## ✅ 一、前提条件

* 已有一个域名，并解析到这台 CentOS 服务器
* NGINX 已安装并运行（可选，但推荐）
* 防火墙已开放 80 和 443 端口

---

## ✅ 二、安装 Certbot（用于申请免费证书）

### 🔸 对于 CentOS 7

```bash
sudo yum install epel-release -y
sudo yum install certbot python2-certbot-nginx -y
```

### 🔸 对于 CentOS 8

```bash
sudo dnf install epel-release -y
sudo dnf install certbot python3-certbot-nginx -y
```

---

## ✅ 三、使用 Certbot 获取 HTTPS 证书

### 自动配置 NGINX 并申请证书（推荐）

```bash
sudo certbot --nginx
```

Certbot 会自动修改你的 NGINX 配置文件，添加 HTTPS 支持。你只需要输入：

* 你的域名（如：`example.com`）
* 一个联系邮箱
* 是否自动重定向 HTTP 到 HTTPS

---

## ✅ 四、测试自动续期

Let's Encrypt 的证书有效期为 90 天，推荐使用 cron 或 systemd 自动续期。

Certbot 安装后默认已添加自动续期任务，你可以手动测试：

```bash
sudo certbot renew --dry-run
```

---

## ✅ 五、不使用 NGINX，仅申请证书（适用于 Docker 场景）

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

这会启动一个临时 HTTP 服务器监听 80 端口进行域名验证，证书默认保存在：

```bash
/etc/letsencrypt/live/yourdomain.com/
├── cert.pem
├── privkey.pem
├── fullchain.pem
```

你可以把这些证书文件挂载到 Docker 容器中使用。

---

## 🧾 常见路径

| 说明   | 路径                                                 |
| ---- | -------------------------------------------------- |
| 证书文件 | `/etc/letsencrypt/live/yourdomain.com/cert.pem`    |
| 私钥文件 | `/etc/letsencrypt/live/yourdomain.com/privkey.pem` |
| 配置备份 | `/etc/letsencrypt/`                                |
| 日志   | `/var/log/letsencrypt/`                            |

---

这里我没有直接使用该路径进行挂载，而是将证书文件复制到 `/usr/local/nginx/certs` 目录下，方便 Docker 容器访问。

我这里在 `/etc/letsencrypt/live/yourdomain.com/` 执行 `ls -al` 命令查看证书文件, 可以发现文件为一个连接指向了 `/etc/letsencrypt/archive/www.xiaozaoshu.top/` 目录下的文件,所以这里我是将该目录下的文件复制到 复制到 `/usr/local/nginx/certs` 目录下，注意文件多了一个 `1` 需要在复制完成后修改下这个名称。
```bash
ls -al
总用量 12
drwxr-xr-x 2 root root 4096 5月  16 11:41 .
drwx------ 3 root root 4096 5月  16 11:41 ..
lrwxrwxrwx 1 root root   42 5月  16 11:41 cert.pem -> ../../archive/www.xiaozaoshu.top/cert1.pem
lrwxrwxrwx 1 root root   43 5月  16 11:41 chain.pem -> ../../archive/www.xiaozaoshu.top/chain1.pem
lrwxrwxrwx 1 root root   47 5月  16 11:41 fullchain.pem -> ../../archive/www.xiaozaoshu.top/fullchain1.pem
lrwxrwxrwx 1 root root   45 5月  16 11:41 privkey.pem -> ../../archive/www.xiaozaoshu.top/privkey1.pem
```

**执行命令启动容器**
```bash 
docker run \
-p 80:80 -p 443:443 \
--name nginx-xiaozaoshu-ssl \
-v /usr/local/nginx/conf/nginx.conf:/etc/nginx/nginx.conf \
-v /usr/local/nginx/conf/conf.d:/etc/nginx/conf.d \
-v /usr/local/nginx/log:/var/log/nginx \
-v /usr/local/nginx/html:/usr/share/nginx/html \
-v /usr/local/nginx/certs:/etc/nginx/certs:ro \
-d nginx:1.27.3-perl
```