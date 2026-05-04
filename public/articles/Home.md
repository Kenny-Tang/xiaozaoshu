##  <font color="red">分支命名：feature/shandong-pc2-202605</font>
## <font color="red">分支命名：feature/shandong-pc2-202605-tanjianwei</font>
## <font color="red">1. 必须写单元测试<br />2. 单元测试要覆盖所有字段<br>3. 请求接口参数命名：XxxRequest</font>

## 内网精益化-项目开标

开标时，批次经理在精益化系统触发项目开标流程。系统根据项目编码列出内网 OSS 指定目录下的所有标书信息同步到精益化数据库；
若为 ZIP 格式则进一步解压,解压后的文件存储到内网 OSS, 并持久化结构化标书信息。
最后将需要智能评标的文件推送至解析服务，并将 AI 评审信息推送至智能体应用。

*项目编码/商务/分标编码_分包编码(没有填无)_投标人名称.pdf*

标书文件：
- Open/182535/商务/互感器_包1_9111000071093123XX_商务.pdf
- Open/182535/商务/互感器_包1_9111000071093123XX_商务.zip

- Open/182535/商务/互感器_包1_9111000071093123XX_商务/tb_document_file.json
- Open/182535/商务/互感器_包1_9111000071093123XX_商务/tb_document_label_info.json
- Open/182535/商务/互感器_包1_9111000071093123XX_商务/uploads/93541433a3124b07bb896010f500ffb4.png

**触发方式**
- 批次经理在精益化系统手动触发，传入项目编码

**主要步骤**
- 向接标平台发送开标请求，通知接标平台进行开标处理（解密标书文件）
- 通过开标一览表初始化元数据信息

- 定时轮询metadata 查询是否存在已解密的标书文件进行处理
    - 根据路径信息保存 metadata 信息到数据库
    - 根据如果是 zip 文件则解压到指定目录

### 项目开标-请求时序图
```mermaid
sequenceDiagram
    participant User as 批次经理
    participant JyhService as 精益化系统服务
    participant ReceiveService as 接标平台服务

    User ->> JyhService: 传入项目编码，触发开标
    JyhService ->> ReceiveService: 发送开标请求，通知接标平台处理开标，解密标书
    JyhService ->> JyhService: 通过开标一览表初始化元数据信息
```

### 文件解析
- 定时轮询 `ztb_bid_metadata_jiangxi` 表，查询是否存在已解密的标书文件进行处理
- 如果 metadata 数据对应的文件存储信息已存在则说明文件已经上传完成，直接进行后续处理；如果不存在则说明文件还未上传完成，继续轮询等待
- 如果标书文件已上传，将文件的存储相关的信息持久化到数据库中，否则继续轮询等待
- 如果是 ZIP 文件，如果文件还未解押则进行解压处理，并将解压后的文件信息持久化到 `tb_structured_file` 表中，供后续文件解析和智能评标使用，如果已解压则直接进行后续处理
- 如果智能评审项目还没有推送解析服务进行解析，在查找需要进行解析的文件后将文件推送之解析服务进行解析，如果已经推送过了则直接进行后续处理
- 调用解析服务状态查询接口查询解析结果，如果解析完成则将数据更新为已解析，否则接续轮询等待
- 如果解析完成则将 AI 评审信息推送至智能体应用 `/api/v1/smartReview/tenderInfo`，如果已经推送过了则直接进行后续处理

### 业务流程图
```mermaid
flowchart TD
    Start([定时轮询 ztb_bid_metadata_jiangxi 表]) --> QueryDecrypted{存在已解密\n的标书文件?}
    QueryDecrypted -- 否 --> Wait1([继续轮询等待])
    QueryDecrypted -- 是 --> CheckStorage{文件存储信息\n是否已存在?}

    CheckStorage -- 否 --> Wait2([继续轮询等待])
    CheckStorage -- 是 --> SaveStorage[将文件存储信息\n持久化到数据库]

    SaveStorage --> IsZip{是否为\nZIP 文件?}

    IsZip -- 否 --> CheckParsed
    IsZip -- 是 --> IsExtracted{文件是否\n已解压?}

    IsExtracted -- 是 --> CheckParsed
    IsExtracted -- 否 --> Extract[解压文件\n将解压后文件信息持久化到\ntb_structured_file]
    Extract --> CheckParsed

    CheckParsed{是否已推送\n解析服务?} -- 是 --> QueryParseResult
    CheckParsed -- 否 --> FindFiles[查找需要解析的文件]
    FindFiles --> PushParse[推送文件至解析服务]
    PushParse --> QueryParseResult

    QueryParseResult[查询未完成解析的任务] --> ParseDone{解析完成?}
    ParseDone -- 否 --> Wait3([继续轮询等待])
    ParseDone -- 是 --> UpdateParsed[更新数据为已解析]

    UpdateParsed --> IsAIPushed{是否已推送\n智能体应用?}
    IsAIPushed -- 是 --> End([结束])
    IsAIPushed -- 否 --> PushAI[将 AI 评审信息推送至智能体应用\n/api/v1/smartReview/tenderInfo]
    PushAI --> End
```

### 试用逻辑
- 导入 excel到 `ztb_bid_metadata_jiangzhe`，模拟开标一览表数据，包含项目编码、分标编码、包编码、文件类型、供应商统一社会信用代码等信息
- 根据 `ztb_bid_metadata_jiangzhe` 解析数据补充到 `ztb_bid_metadata_jiangxi` 表中，模拟开标后生成的元数据信息
- 补充 PDF 文件的上传信息到 `file_upload_task` 和 `file_storage` 表中，模拟文件上传完成的状态
- 补充 ZIP 解压后的结构化文件信息到 `tb_structured_file` 表中，模拟解压完成的状态
- 如果智能评审项目还没有推送解析服务进行解析，在查找需要进行解析的文件后将文件推送之解析服务进行解析，如果已经推送过了则直接进行后续处理
- 调用解析服务状态查询接口查询解析结果，如果解析完成则将数据更新为已解析，否则接续轮询等待
- 如果解析完成则将 AI 评审信息推送至智能体应用 `/api/v1/smartReview/tenderInfo`，如果已经推送过了则直接进行后续处理

### 试用逻辑业务流程图
```mermaid
flowchart TD
    Start([开始]) --> ImportExcel[导入 Excel 到 ztb_bid_metadata_jiangzhe\n模拟开标一览表数据]
    ImportExcel --> SyncMeta[解析数据补充到 ztb_bid_metadata_jiangxi\n模拟开标后生成的元数据信息]
    SyncMeta --> FillUpload[补充 PDF 文件上传信息到\nfile_upload_task & file_storage\n模拟文件上传完成状态]
    FillUpload --> FillStructured[补充 ZIP 解压后结构化文件信息到\ntb_structured_file\n模拟解压完成状态]

    FillStructured --> CheckParsed{是否已推送\n解析服务?}
    CheckParsed -- 是 --> QueryParseResult
    CheckParsed -- 否 --> FindFiles[查找需要解析的文件]
    FindFiles --> PushParse[推送文件至解析服务]
    PushParse --> QueryParseResult

    QueryParseResult[调用解析服务状态查询接口] --> ParseDone{解析完成?}
    ParseDone -- 否 --> Wait([继续轮询等待])
    ParseDone -- 是 --> UpdateParsed[更新数据为已解析]

    UpdateParsed --> IsAIPushed{是否已推送\n智能体应用?}
    IsAIPushed -- 是 --> End([结束])
    IsAIPushed -- 否 --> PushAI[将 AI 评审信息推送至智能体应用\n/api/v1/smartReview/tenderInfo]
    PushAI --> End
```

# 表设计
## ER 图
```mermaid
erDiagram
   ztb_bid_metadata_jiangxi["文件元数据信息"] {
        id BIGINT
        supplier_code varchar(63) "供应商统一社会信用代码"
        file_id VARCHAR(64)   "对外唯一标识"
        client_type varchar(31) "JIANGXI:江西，LU：山东"
        ca_type varchar(31) "CA类型 GW_CA：国网CA，UTC:优泰CA"
        project_code varchar(127) "项目编码"
        bid_code varchar(127) "分标编码"
        package_code varchar(127) "分包编码"
        file_type varchar(15) "文件类型 商务/技术"
        file_name VARCHAR(500) "文件名：projectCode-bidCode-packageCode-fileType-supplierCode.zip"
        sign_value VARCHAR(512) "国网CA原始文件签名，开标解密后用于明文验签"
        encrypted_sign_value VARCHAR(512) "国网CA加密文件签名，上传完成时用于密文验签"
        file_size BIGINT "文件大小(字节)"
        file_suffix VARCHAR(15)  "文件后缀(zip/pdf)"
        file_hash VARCHAR(63)
        status varchar(15)  "UPLOADING-上传中, COMPLETED-上传完成, CANCEL-撤销, FAILED-失败"
        total_chunks INT  "总分片数"
        uploaded_chunks INT  "已上传分片数"
        chunk_size INT  "分片大小(默认5MB)"
        completed_time datetime  "完成时间"
        create_time datetime   "创建时间"
        update_time datetime "更新时间"
    }
    %% 此处和元数据表的冗余是合理的
    file_upload_task["文件上传任务"] {
        id BIGINT
        file_id   VARCHAR(64)   "全局唯一 UUID，对客户端暴露"
        business_id bigint "所属业务 Id"
        business_type varchar(100) "所属业务 业务类型"
        upload_id   VARCHAR(128)  "task_upload_id"
        file_name VARCHAR(500) "文件名：projectCode-bidCode-packageCode-fileType-supplierCode.zip"
        file_size BIGINT "文件大小(字节)"
        file_suffix VARCHAR(15)  "文件后缀(zip/pdf)"
        mime_type VARCHAR(31)  "文件类型"
        file_hash VARCHAR(63)
        status varchar(15)  "UPLOADING-上传中, COMPLETED-上传完成, DELETE-删除, FAILED-失败, INNER_SYNCED-内网已同步"
        total_chunks INT  "总分片数"
        uploaded_chunks INT  "已上传分片数"
        chunk_size INT  "分片大小(默认5MB)"
        completed_time datetime  "完成时间"
        expires_at    datetime   "任务过期时间，超时自动取消"
        create_time datetime   "创建时间"
        update_time datetime "更新时间"
    }

    file_storage["文件物理存储信息"] {
        id BIGINT "存储ID"
        file_upload_task_id BIGINT "上传文件 id"
        region varchar(63) "INNER_ALI_OSS-阿里云内网,OUT_ALI_OSS-阿里云外网"
        file_hash varchar(64) "文件hash"
        file_size BIGINT "文件大小"
        bucket VARCHAR(127) "存储位置"
        object_key VARCHAR(500) "存储路径"
        storage_type VARCHAR(50) "存储类型OSS/NFS"
        create_time datetime   "创建时间"
        update_time datetime "更新时间"
    }
    
    file_chunk["文件分片信息"]{ 
        id BIGINT "分片ID"
        file_upload_task_id BIGINT "文件ID"
        upload_id VARCHAR(128) "上传会话ID"
        part_number INT "分片序号"
        part_size INT "分片大小"
        etag  varchar(127) "分片hash"
        status INT "状态: 0-失败, 1-成功"
        uploaded_time  datetime  "上传完成时间"
        create_time datetime "创建时间"
        update_time datetime "更新时间"
    }

    tb_structured_file {
        id BIGINT "主键ID"
        file_upload_task_id BIGINT "对应结构化文件 Id"
        tb_doc_file_name   varchar(256)        "文件相对压缩文件的相对位置"
        file_suffix VARCHAR(15)  "文件后缀(zip/pdf)"
        file_content varchar(60000) "文件内容, 仅在文件为 JSON 时进行存储"
        create_time datetime "创建时间"
    }

    tb_structured_file        }|--|| file_upload_task : "结构化文件 Id"
    ztb_bid_metadata_jiangxi ||--|{ file_upload_task : "用户投标文件 1 - N 用户文件上传"
    file_upload_task ||--|{ file_chunk : "文件上传任务 1 - N 文件分片"
    file_upload_task ||--|{ file_storage: "文件上传任务 1 - N 物理存储"

```

## 内网精益化-获取ECP项目信息

批次经理登录精益化系统，输入 ECP 账号和密码，系统调用 ECP 接口拉取该账号下的项目列表。对每条项目记录判断本地是否已存在，已存在则跳过，不存在则写入本地数据库完成同步。

**触发方式**
- 批次经理在精益化系统手动触发，输入 ECP 账号/密码

**主要步骤**
1. 调用 `EcpProjectService`，携带 ECP 账号/密码请求 ECP 系统获取项目列表
2. 遍历项目列表，按 `projectCode` 查询本地数据库
3. 本地已存在 → 跳过
4. 本地不存在 → 写入本地 `ecp_project` 表

### 请求时序图
```mermaid
sequenceDiagram
    participant User as 批次经理
    participant EcpProjectService as EcpProjectService
    participant ECP as ECP系统
    participant Database as 内网数据库

    User ->> EcpProjectService: 输入ECP账号/密码，触发同步
    EcpProjectService ->> ECP: 使用账号/密码请求项目列表
    ECP -->> EcpProjectService: 返回项目列表
    loop 遍历每个项目
        EcpProjectService ->> Database: 按 projectCode 查询是否已存在
        Database -->> EcpProjectService: 查询结果
        alt 已存在
            EcpProjectService ->> EcpProjectService: 跳过
        else 不存在
            EcpProjectService ->> Database: 写入 ecp_project 记录
        end
    end
    EcpProjectService -->> User: 返回同步结果(新增N条，跳过M条)
```

### 业务流程图
```mermaid
flowchart TD
    Start([开始: 批次经理输入ECP账号/密码]) --> CallEcp[调用ECP系统\n获取项目列表]
    CallEcp --> EcpOk{请求成功?}
    EcpOk -- 否 --> ErrReturn([返回失败: ECP接口异常])
    EcpOk -- 是 --> Loop[/遍历项目列表/]

    Loop --> QueryLocal[按 projectCode\n查询本地数据库]
    QueryLocal --> Exists{本地已存在?}

    Exists -- 是 --> Skip[跳过]
    Exists -- 否 --> Insert[写入 ecp_project 表]

    Skip --> HasMore{还有下一条?}
    Insert --> HasMore

    HasMore -- 是 --> Loop
    HasMore -- 否 --> Return([返回同步结果\n新增N条，跳过M条])
```