# Git常用操作

## 把远程分支拉到本地

	git fetch origin develop（develop为远程仓库的分支名）

## 在本地创建分支dev并切换到该分支

	git checkout -b dev(本地分支名称) origin/develop(远程分支名称)
### 查看当前修改的相关信息 git status
	git status
## 合并分支 git merge
	git merge  合并分支名
## Git 版本回退
### reset
1. 在gitlab上找到要恢复的版本号，如：
   0f4527579f12b089832cd40724b55eecd4fdfe2e
2. 在客户端执行如下命令（执行前，先将本地代码切换到对应分支）：
```shell
	git reset --hard 0f4527579f12b089832cd40724b55eecd4fdfe2e 
```
3. 强制push到对应的远程分支（如提交到develop分支）
```shell
git push -f -u origin develop
```
OK，现在到服务器上看到的代码就已经被还原回去了。
### revert
这种方式不会把版本往前回退，而是生成一个新的版本，你之前操作的提交记录也会被保留下来。

操作步骤如下：
1. 找到你误提交之前的版本号
2. git revert -n 版本号
3. git commit -m xxxx 提交
4. git push 推送到远程

## Git还原某个特定的文件到之前的版本
日常开发工作中不小心提交了错误的代码，或者当前功能还不能提交，误操作导致的代码提交都是一些经常发生的事情，这时我们需要撤回这些提交。

1.  在命令行中输入 `git log <filename>` 得到该文件的 commit 历史。

2. 复制需要回退版本的hash，在此假设我们回退到 `429c41a140b5110f08140304fb45a4a1a461cb90` ,则复制该序列即可

3. checkout 对应版本。格式为 `git checkout <hash> <filename>`, 在此即为命令行中输入
```shell 
git checkout d98a0f565804ba639ba46d6e4295d4f787ff2949 src/main/webapp/jsp/marketing/activeinfo/queryPosActiveInfo.jsp`
```
4. commit checkout下来的版本。 如： `git commit -m "revert to previous version"`


```shell
kenny@bogon MyProject % git log src/main/webapp/jsp/marketing/activeinfo/queryPosActiveInfo.jsp
commit 63ebf0874b662c56a4d4d137d2044b420d74730a (HEAD -> master, origin/master, origin/HEAD)
Author: tanjw <tanjw@xxx.com>
Date:   Mon May 17 10:44:29 2021 +0800

    采购活动列表采用招商中心活动关系

commit 429c41a140b5110f08140304fb45a4a1a461cb90
Author: tanjw <tanjw@xxx.com>
Date:   Tue Apr 27 10:47:03 2021 +0800

    OFFLINE-773 运营：所有字段统一叫直属服务商

commit 48654d973d2d3ad0db7e1d956451714f291b4046
Author: tanjw <tanjw@xxx.com>
Date:   Thu Apr 22 15:52:33 2021 +0800

    修改激信息查询
		
kenny@bogon MyProject % git checkout 429c41a140b5110f08140304fb45a4a1a461cb90 src/main/webapp/jsp/marketing/activeinfo/queryPosActiveInfo.jsp
Updated 1 path from e5a4798
kenny@bogon MyProject % git commit -m "revert to previous version"
```
## Git 同步远程仓库
当 `Fork` 了一个远程仓库后，远程仓库有了新代码提交，为了保持一致，需要同步一下远程的修改，将远程代码与本地代码合并。
- 首先查看下配置的远程分支
>  git remote -v
```shell
kenny@bogon xxxx % git remote -v
origin	http://192.168.x.x/tanjianwei/xxxx.git (fetch)
origin	http://192.168.x.x/tanjianwei/xxxx.git (push)
```
- 配置对应的上游仓库
  目前只有自己的仓库信息并没有上游仓库的信息，配置好上游仓库的信息后才能进行其他操作
> git remote add upstream http://xxxxx/YOUR_PROJECT.git

添加完成后再查看远程分支信息，就会看到多了一个上游仓库的信息
```shell
kenny@bogon Project % git remote add upstream http://192.168.x.x/platform/Project.git
kenny@bogon Project % git remote -v
origin	http://192.168.x.x/tanjianwei/Project.git (fetch)
origin	http://192.168.x.x/tanjianwei/Project.git (push)
upstream	http://192.168.x.x/platform/Project.git (fetch)
upstream	http://192.168.x.x/platform/Project.git (push)
```
- 将上游仓库的代码拉去到本地
> git fetch upstream

```
kenny@bogon Project % git fetch upstream
remote: Enumerating objects: 1235, done.
remote: Counting objects: 100% (1158/1158), done.
remote: Compressing objects: 100% (491/491), done.
remote: Total 1063 (delta 469), reused 962 (delta 389), pack-reused 0
Receiving objects: 100% (1063/1063), 123.95 KiB | 4.13 MiB/s, done.
Resolving deltas: 100% (469/469), completed with 51 local objects.
From http://192.168.x.x/platform/Project
 * [new branch]      master       -> upstream/master
 * [new branch]      release_test -> upstream/release_test
```
- 查看当前所在分支
> git branch

如果当前分支不是想要合并上游代码的分支，使用以下命令切换到对应的分支上
> git checkout YOUR_BRANCH_NAME
```shell
kenny@bogon Project % git branch
  master
* release_test
```
- 合并上游分支代码
> git merge upstream/release_test
如果有冲突，去解决冲突就好了。
```shell
kenny@bogon Project % git merge upstream/release_test
Auto-merging src/main/resources/spring-context/spring-config.xml
Auto-merging src/main/resources/mybatis/mybatis-config.xml
CONFLICT (content): Merge conflict in src/main/java/com/lefu/pospboss/institution/service/InstitutionInfoService.java
```
## git status 命令中出现中文路径被转义的问题

如果只有 `git status` 命令中出现中文路径被转义的问题，可能是 Git 的 `core.quotepath` 设置导致的。这个设置会控制文件路径中非 ASCII 字符的显示形式，默认开启转义。

解决方法, 禁用 `core.quotepath`
运行以下命令：

```bash
git config --global core.quotepath false
```
此配置项的作用：

设置为 true（默认）：非 ASCII 字符显示为转义的 Unicode 形式（如 \u4f60\u597d）。
设置为 false：直接显示原始字符（如 你好）。
验证设置是否生效
运行以下命令查看当前配置：

```bash
git config --get core.quotepath
```
然后测试：

```bash
git status
```
中文文件路径应显示为正常的中文，而不是转义的 Unicode。

