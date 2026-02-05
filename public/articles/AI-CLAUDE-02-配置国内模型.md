## claude 在国内是被禁止使用的, claude 对大陆地区不提供服务
/init is analyzing your codebase…
⎿  API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}} · Please run /login

## 配置 claude code 使用 QWEN 模型
### 配置环境变量
要通过兼容 Anthropic API 的方式，来接入阿里云百炼的模型服务，需要配置以下两个环境变量。

1. ANTHROPIC_BASE_URL：设置为 https://dashscope.aliyuncs.com/apps/anthropic
2. ANTHROPIC_API_KEY或ANTHROPIC_AUTH_TOKEN：设置为阿里云百炼 API Key。

- 添加环境变量
 用百炼 API KEY 替换 YOUR_DASHSCOPE_API_KEY
```bash 
echo 'export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/apps/anthropic"' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY="YOUR_DASHSCOPE_API_KEY"' >> ~/.zshrc
```
- 使环境变量生效
```bash
source ~/.zshrc
```
- 验证环境变量是否配置成功, 打开一个新的终端窗口，运行以下命令：
```bash
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_API_KEY
```
如果正确配置，应该分别输出：
```
https://dashscope.aliyuncs.com/apps/anthropic
YOUR_DASHSCOPE_API_KEY
```
