# 创建需要的目录
```shell
[root@hera data]# mkdir -p /data/mysql/data
[root@hera data]# mkdir -p /data/mysql/log
[root@hera data]# mkdir -p /data/mysql/conf
```

# 下载镜像

```shell
docker pull mysql:5.7.44
```

# 启动容器
```shell
# 启动容器 
# --name 指定名称
# -v dir:dir 挂载目录
# -d 后台启动
# -p port:port 映射端口
# --restart=on-failure:3 重启策略  重启三次，失败三次后不在重启
[root@hera data]# docker psdocker run -p 3306:3306 --name mysql -v /data/mysql/log:/var/log/mysql -v /data/mysql/data:/var/lib/mysql -v /data/mysql/conf:/etc/mysql --restart=on-failure:3 -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7.44

# 发现没有正常启动 
[root@hera data]# docker ps

# 查看日志
[root@hera data]# docker logs -f mysql
2024-12-17 03:12:48+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 5.7.44-1.el7 started.
2024-12-17 03:12:48+00:00 [ERROR] [Entrypoint]: mysqld failed while attempting to check config
	command was: mysqld --verbose --help --log-bin-index=/tmp/tmp.uO4UgFbYwd
	mysqld: Can't read dir of '/etc/mysql/conf.d/' (Errcode: 2 - No such file or directory)

# 异常原因： 宿主机没有对应的路径， 需要创建相应的路径
[root@hera data]# mkdir -p /data/mysql/conf/conf.d
[root@hera data]# mkdir -p /data/mysql/conf/mysql.conf.d

# 重新启动mysql
[root@hera data]# docker start mysql
# 重新查看 进程 mysql 启动成功
[root@hera data]# docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                                                  NAMES
0b7d749c2fbc   mysql:5.7.44   "docker-entrypoint.s…"   9 minutes ago   Up 3 seconds   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   mysql
```