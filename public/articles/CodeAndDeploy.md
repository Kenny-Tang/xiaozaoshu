---
title: "开发及上线规范"
author: "谭建伟"
mainfont: "Songti SC"
pdf-engine: xelatex
fontsize: 12pt
geometry: a4paper
---
# 1 GIT

## 1.1 Git 使用规范

- 使用Git过程中，必须通过创建分支进行开发，坚决禁止在主干分支上直接开发。review的同事有责任检查其他同事是否遵循分支规范。
- 在Git中，默认是不会提交空目录的，如果想提交某个空目录到版本库中，需要在该目录下新建一个
    .gitignore 的空白文件，就可以提交了
- 多人协作时，不要各自在自己的 Git
    分支开发，然后发文件合并。正确的方法应该是开一个远程分支，然后一起在远程分支里协作。不然，容易出现代码回溯（即别人的代码被覆盖的情况）
- 每个人提交代码是一定要 git diff
    看提交的东西是不是都是自己修改的。如果有不是自己修改的内容，不要提交，否则很可能就是代码回溯
- review
    代码的时候如果看到有被删除掉的代码，一定要确实是否是写代码的同事自己删除的。如果不是，很可能就是代码回溯

## 1.2 Git 分支建立

分支分为需求分支、测试分支 和 修复分支

需求分支 研发人员 主要的提交分支 在 `feature` 目录下，分支命名格式
`日期+需求名称(英文)`

测试分支 测试人员 使用的测试分支 在 `release` 目录下, 分支命名格式
`releae-test`，如无并行任务保留一个分支即可

修复分支 hotfix-{date} 问题紧急修复分支 `hotfix` 目录下，分支命名格式
`hotfix-日期+bug`


代码格式如下：
```text
    master
    ├── feature
    │   └── 20250102-reuse-catagory-item 
    │   └── 20250202-reuse-contract
    ├── release 
    │   └── release-test
    │   └── 20250102-reuse-catagory-item-v1
    ├── hotfix
    │   └── hotfix-20250102-xxx1
    │   └── hotfix-20250102-xxx2
```

## 1.3 开发流程
1.  开发：开发分支编写与提交代码
2.  测试：研发自测与联调完成，merge 开发分支（feature）代码 至
    测试分支（test）
    进行测试部署，测试完成前，如无阻断问题，不进行代码再次，如果 master
    代码有改动需要合并Master代码后进行回归测试
3.  上线：测试完成后，基于测试分支打包上线镜像，进行上线，上线完成后，如无问题，代码合并至
    Master

![开发上线流程-代码合并流程.png](../images/670326044217298954.png)

# 2 项目打包发布

项目目录如下：

``` scss
    src
    ├── main
    │   ├── java
    │   ├── resources
    │   │   ├── application.properties (默认配置)
    │   │   ├── dev
    │   │   │   └── application.properties (开发环境配置)
    │   │   ├── test
    │   │   │   └── application.properties (测试环境配置)
    │   │   ├── prod
    │   │   │   └── application.properties (生产环境配置)
```
<br />
打包命令如下：

```shell
 mvn clean package -P env
```

其中 `env` 为指定打包所需要激活的配置， 开发、测试、生产分别为
`dev、test、prod`，
打包完成后，指定环境下的资源被打包到主资源目录下，如果有重名的配置文件则会覆盖主目录配置，优先使用自定义的配置。

## 2.1 研发环境打包

    mvn clean package 或者 mvn clean package -P dev

## 2.2 测试环境打包

    mvn clean package -P test

## 2.3 生产环境打包

    mvn clean package -P prod

## 2.4 项目默认编译配置

<details>
<summary>
根据 dev test prod 环境配置打包策略
</summary>

``` xml
<profiles>
    <!-- 开发环境 -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault> <!-- 默认激活开发环境 -->
        </activation>
        <build>
            <resources>
                <resource>
                    <directory>src/main/resources/dev</directory>
                    <filtering>false</filtering>
                </resource>
            </resources>
        </build>
    </profile>
    <!-- 测试环境 -->
    <profile>
        <id>test</id>
        <build>
            <resources>
                <!-- 测试资源 -->
                <resource>
                    <directory>src/main/resources/test</directory>
                    <filtering>false</filtering>
                </resource>
            </resources>
        </build>
    </profile>
    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <build>
            <resources>
                <resource>
                    <directory>src/main/resources/prod</directory>
                    <filtering>false</filtering>
                </resource>
            </resources>
        </build>
    </profile>
</profiles>
```

</details>

# 代码规范
<br />
<br />
<br />
<br />
