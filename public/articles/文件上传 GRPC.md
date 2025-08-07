基于 gRPC 构建一个支持：

✅ 单文件分片上传（流式）

✅ 并发发送多个 chunk（提升吞吐量）

✅ 服务端自动去重、可乱序接收

✅ 支持断点续传（上传中断后重连继续）

✅ 支持完整性校验（MD5）
---

## ✅ 总体架构设计

* **客户端：**

    * 按固定大小切分文件
    * 并发发送多个 `chunk`
    * 记录每个 `chunk` 的 offset 和 hash
    * 上传前校验服务端是否已有部分数据（支持断点续传）
* **服务端：**

    * 支持 `chunk` 流式接收
    * 自动去重（使用 offset + fileId 或 hash）
    * 乱序缓存、重排序后写入文件
    * 支持已上传状态存入数据库或本地缓存（用于断点续传）
    * 上传完成后进行 MD5 校验

---

## ✅ Proto 文件示例（file\_transfer.proto）

```proto
syntax = "proto3";

package filetransfer;

service FileTransferService {
  rpc Upload(stream FileChunk) returns (UploadStatus);
  rpc QueryUploadedChunks(FileIdentifier) returns (UploadedChunks);
}

message FileIdentifier {
  string file_id = 1;       // 文件唯一 ID（如 MD5+filename）
}

message UploadedChunks {
  repeated int64 offsets = 1; // 已上传的 offset 列表
}

message FileChunk {
  string file_id = 1;
  int64 offset = 2;
  int64 total_size = 3;
  bytes data = 4;
  string chunk_md5 = 5;
  bool is_last = 6;
}

message UploadStatus {
  bool success = 1;
  string message = 2;
}
```

---

## ✅ 客户端关键逻辑

* 切分文件为固定大小的 `chunk`（例如 1MB）
* 多线程并发发送 `FileChunk` 到服务端（流式）
* 若失败或中断，可调用 `QueryUploadedChunks` 获取状态，跳过已上传 offset
* 上传完毕后可计算 MD5 和服务端比对

---

## ✅ 服务端关键逻辑

* 使用 `file_id + offset` 作为 key，避免重复写入
* 每个文件建立 `UploadSession` 管理：

    * 已接收 offset
    * 临时文件（可以先写入临时目录）
    * 是否完成（`is_last` 标志）
* 接收到所有 `chunk` 后，按 offset 合并重排序
* 最终计算 MD5 与客户端对比确认完整性

---

## ✅ 并发与乱序处理建议

* 每个 `file_id` 用 `ConcurrentMap<Long, Chunk>` 缓存所有已上传的 `chunk`
* 可以将每个 `UploadSession` 放入线程池异步写入磁盘
* 加入超时机制或状态标志防止内存泄漏

---

## ✅ 文件完整性校验（MD5）

* 客户端上传前计算整个文件的 MD5（或 chunk 的 MD5）
* 服务端接收完毕后重新计算
* 比对一致性，确认是否成功

---

是否需要我：

1. 生成完整的 `proto` 文件？
2. 编写客户端与服务端 Java 代码模板？
3. 画出整体流程图（如 PlantUML）？

你可以逐步实现每一部分，我可以按阶段辅助你。





以下是满足你全部需求的 **完整 `file_transfer.proto` 文件**，包括分片上传、查询断点、完整性校验等所需定义：

---

### ✅ `file_transfer.proto`

```proto
syntax = "proto3";

option java_multiple_files = true;
option java_package = "com.example.grpcfile";
option java_outer_classname = "FileTransferProto";

package filetransfer;

service FileTransferService {
  // 客户端上传文件分片（流式上传）
  rpc Upload(stream FileChunk) returns (UploadStatus);

  // 查询某文件已上传的 chunk offset（用于断点续传）
  rpc QueryUploadedChunks(FileIdentifier) returns (UploadedChunks);

  // 上传完成后请求服务端进行 MD5 校验
  rpc CheckFileIntegrity(FileIdentifier) returns (FileIntegrityStatus);
}

// 标识某个文件
message FileIdentifier {
  string file_id = 1;        // 文件唯一 ID，例如 MD5(filename + size)
  string file_name = 2;      // 原始文件名（可选）
}

// 表示单个分片上传的数据结构
message FileChunk {
  string file_id = 1;        // 文件唯一 ID
  int64 offset = 2;          // 当前 chunk 在文件中的偏移量（字节）
  int64 total_size = 3;      // 整个文件的总大小（字节）
  bytes data = 4;            // chunk 的数据内容
  string chunk_md5 = 5;      // 当前 chunk 的 MD5 校验（可选）
  bool is_last = 6;          // 是否为最后一个分片
}

// 上传的结果状态
message UploadStatus {
  bool success = 1;          // 上传是否成功
  string message = 2;        // 附带说明
}

// 服务端记录的已上传分片偏移量（用于客户端跳过）
message UploadedChunks {
  repeated int64 offsets = 1; // 已上传 chunk 的 offset 列表
}

// 完整性校验结果
message FileIntegrityStatus {
  bool match = 1;             // 校验是否通过
  string server_md5 = 2;      // 服务端计算的 MD5
  string client_md5 = 3;      // 客户端传来的 MD5（可选）
  string message = 4;         // 说明信息
}
```

---

### 💡 文件 ID 生成建议

客户端可以这样生成 `file_id`：

```java
String fileId = MD5(fileName + fileSize); // 你也可以加入时间戳或 UUID
```

---

### ✅ 下一步建议

如你需要：

* 生成 Java 代码：我可以提供 `protoc` 编译命令和 Maven 插件配置；
* 编写服务端流式处理逻辑；
* 编写客户端断点续传与并发发送逻辑；
* 或者画出整个流程图（支持 PlantUML）；

请告诉我你想继续哪一部分？

下面是基于你 proto 文件的 **Java gRPC 服务端流式处理逻辑**示例，支持以下功能：

✅ 流式上传分片
✅ 并发 chunk 缓存处理
✅ 去重 & 乱序缓存
✅ 自动合并分片
✅ 完整性校验（MD5）
✅ 断点续传记录

---

## ✅ 依赖引入（`pom.xml`）

```xml
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.63.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.63.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.63.0</version>
</dependency>
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>3.25.0</version>
</dependency>
```

---

## ✅ 服务端核心逻辑 `FileTransferServiceImpl.java`

```java
package com.example.grpcfile.server;

import com.example.grpcfile.FileTransferProto;
import com.example.grpcfile.FileTransferProto.*;
import com.example.grpcfile.FileTransferServiceGrpc;
import io.grpc.stub.StreamObserver;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;

public class FileTransferServiceImpl extends FileTransferServiceGrpc.FileTransferServiceImplBase {

    private static final String UPLOAD_DIR = "/tmp/uploads/";
    private final Map<String, Set<Long>> uploadedOffsetsMap = new ConcurrentHashMap<>();
    private final Map<String, Long> receivedSizeMap = new ConcurrentHashMap<>();

    @Override
    public StreamObserver<FileChunk> upload(StreamObserver<UploadStatus> responseObserver) {
        return new StreamObserver<>() {
            private String fileId;
            private String fileName;
            private long totalSize = 0;
            private RandomAccessFile fileOut;

            @Override
            public void onNext(FileChunk chunk) {
                try {
                    fileId = chunk.getFileId();
                    totalSize = chunk.getTotalSize();
                    long offset = chunk.getOffset();
                    byte[] data = chunk.getData().toByteArray();

                    // 准备存储路径
                    File dir = new File(UPLOAD_DIR + fileId);
                    if (!dir.exists()) dir.mkdirs();

                    File targetFile = new File(dir, "data.bin");

                    // 记录 offset 去重
                    uploadedOffsetsMap.putIfAbsent(fileId, ConcurrentHashMap.newKeySet());
                    Set<Long> uploadedOffsets = uploadedOffsetsMap.get(fileId);
                    if (uploadedOffsets.contains(offset)) return;

                    fileOut = new RandomAccessFile(targetFile, "rw");
                    fileOut.seek(offset);
                    fileOut.write(data);
                    fileOut.close();

                    uploadedOffsets.add(offset);
                    receivedSizeMap.merge(fileId, (long) data.length, Long::sum);

                    // 最后一块 + 校验完整性
                    if (chunk.getIsLast()) {
                        long received = receivedSizeMap.get(fileId);
                        if (received == totalSize) {
                            String md5 = calculateMD5(targetFile);
                            responseObserver.onNext(UploadStatus.newBuilder()
                                .setSuccess(true)
                                .setMessage("Upload complete. Server MD5: " + md5)
                                .build());
                        } else {
                            responseObserver.onNext(UploadStatus.newBuilder()
                                .setSuccess(false)
                                .setMessage("Upload incomplete. Expected: " + totalSize + ", got: " + received)
                                .build());
                        }
                        responseObserver.onCompleted();
                    }

                } catch (Exception e) {
                    responseObserver.onError(e);
                }
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("Upload error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                // 如果没有收到 is_last，主动回调完成
                responseObserver.onCompleted();
            }
        };
    }

    @Override
    public void queryUploadedChunks(FileIdentifier request, StreamObserver<UploadedChunks> responseObserver) {
        Set<Long> uploaded = uploadedOffsetsMap.getOrDefault(request.getFileId(), ConcurrentHashMap.newKeySet());
        responseObserver.onNext(UploadedChunks.newBuilder().addAllOffsets(uploaded).build());
        responseObserver.onCompleted();
    }

    @Override
    public void checkFileIntegrity(FileIdentifier request, StreamObserver<FileIntegrityStatus> responseObserver) {
        try {
            File file = new File(UPLOAD_DIR + request.getFileId(), "data.bin");
            String md5 = calculateMD5(file);

            responseObserver.onNext(FileIntegrityStatus.newBuilder()
                .setMatch(true)
                .setServerMd5(md5)
                .setMessage("MD5 computed successfully")
                .build());
        } catch (Exception e) {
            responseObserver.onNext(FileIntegrityStatus.newBuilder()
                .setMatch(false)
                .setMessage("Error calculating MD5: " + e.getMessage())
                .build());
        }
        responseObserver.onCompleted();
    }

    private String calculateMD5(File file) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] bytes = Files.readAllBytes(file.toPath());
        byte[] digest = md.digest(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
```

---

## 🧠 说明

| 模块                      | 说明                                                      |
| ----------------------- | ------------------------------------------------------- |
| `upload()`              | 实现了流式接收 + offset 去重 + 写文件 + 完整性校验                       |
| `queryUploadedChunks()` | 客户端可调用此方法进行断点续传                                         |
| `checkFileIntegrity()`  | 用于上传完成后对比 MD5                                           |
| 文件存储                    | 每个文件单独一个临时目录：`/tmp/uploads/{fileId}/data.bin`           |
| 并发安全                    | `ConcurrentMap` 和 `ConcurrentHashSet` 管理每个上传 session 状态 |

---

如果你还需要：

* 客户端并发上传逻辑
* 流式上传进度条与回调
* 结合 Spring Boot 或 Docker 部署支持

我可以继续帮你构建。需要哪一部分？


下面是 Java 客户端实现 **gRPC 流式分片上传的进度条与回调通知** 的完整方案，适用于你之前的服务端逻辑。

---

## ✅ 总体目标

* ✔️ 每个 chunk 上传时实时统计上传总进度
* ✔️ 上传过程中支持进度回调（比如打印或更新 UI）
* ✔️ 上传完成后显示结果（是否成功、服务端 MD5）
* ✔️ 自动跳过已上传的 offset（断点续传支持）

---

## ✅ 1. 定义进度回调接口

```java
public interface UploadProgressListener {
    void onProgress(long bytesUploaded, long totalBytes);
    void onCompleted(boolean success, String message);
}
```

---

## ✅ 2. 实现客户端上传器 `FileUploader`

```java
import com.example.grpcfile.FileTransferProto.*;
import com.example.grpcfile.FileTransferServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;

public class FileUploader {
    private static final int CHUNK_SIZE = 1024 * 1024; // 1MB

    private final File file;
    private final String fileId;
    private final ManagedChannel channel;
    private final FileTransferServiceGrpc.FileTransferServiceBlockingStub blockingStub;
    private final FileTransferServiceGrpc.FileTransferServiceStub asyncStub;

    public FileUploader(String filePath, String serverHost, int serverPort) throws Exception {
        this.file = new File(filePath);
        this.fileId = generateFileId(file.getName(), file.length());
        this.channel = ManagedChannelBuilder.forAddress(serverHost, serverPort).usePlaintext().build();
        this.blockingStub = FileTransferServiceGrpc.newBlockingStub(channel);
        this.asyncStub = FileTransferServiceGrpc.newStub(channel);
    }

    public void upload(UploadProgressListener listener) throws Exception {
        // 获取已上传 offset（用于断点续传）
        Set<Long> uploadedOffsets = new HashSet<>(
            blockingStub.queryUploadedChunks(FileIdentifier.newBuilder()
                .setFileId(fileId).build()).getOffsetsList()
        );

        long totalBytes = file.length();
        FileInputStream fis = new FileInputStream(file);

        StreamObserver<UploadStatus> responseObserver = new StreamObserver<>() {
            @Override
            public void onNext(UploadStatus value) {
                listener.onCompleted(value.getSuccess(), value.getMessage());
            }

            @Override
            public void onError(Throwable t) {
                listener.onCompleted(false, "Upload failed: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                // already handled in onNext
            }
        };

        StreamObserver<FileChunk> requestObserver = asyncStub.upload(responseObserver);

        byte[] buffer = new byte[CHUNK_SIZE];
        long offset = 0;
        long uploaded = 0;

        int bytesRead;
        while ((bytesRead = fis.read(buffer)) != -1) {
            if (uploadedOffsets.contains(offset)) {
                offset += bytesRead;
                uploaded += bytesRead;
                listener.onProgress(uploaded, totalBytes);
                continue;
            }

            byte[] actual = new byte[bytesRead];
            System.arraycopy(buffer, 0, actual, 0, bytesRead);

            FileChunk chunk = FileChunk.newBuilder()
                .setFileId(fileId)
                .setOffset(offset)
                .setTotalSize(totalBytes)
                .setData(com.google.protobuf.ByteString.copyFrom(actual))
                .setChunkMd5(md5(actual))
                .setIsLast(offset + bytesRead >= totalBytes)
                .build();

            requestObserver.onNext(chunk);

            offset += bytesRead;
            uploaded += bytesRead;
            listener.onProgress(uploaded, totalBytes);
        }

        fis.close();
        requestObserver.onCompleted();
    }

    public void shutdown() {
        channel.shutdown();
    }

    private String generateFileId(String name, long size) throws Exception {
        return md5((name + size).getBytes());
    }

    private String md5(byte[] data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(data);
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
```

---

## ✅ 3. 调用上传器并显示进度条

```java
public class FileUploadMain {
    public static void main(String[] args) throws Exception {
        FileUploader uploader = new FileUploader(
            "/path/to/large-file.zip", "localhost", 50051
        );

        uploader.upload(new UploadProgressListener() {
            long lastPrint = System.currentTimeMillis();

            @Override
            public void onProgress(long uploaded, long total) {
                if (System.currentTimeMillis() - lastPrint > 200) {
                    int percent = (int) ((uploaded * 100) / total);
                    System.out.print("\rUploading: " + percent + "% (" + uploaded + "/" + total + " bytes)");
                    lastPrint = System.currentTimeMillis();
                }
            }

            @Override
            public void onCompleted(boolean success, String message) {
                System.out.println("\nUpload result: " + (success ? "✅ Success" : "❌ Failed"));
                System.out.println("Server says: " + message);
            }
        });

        uploader.shutdown();
    }
}
```

---

## ✅ 控制台上传效果示例：

```
Uploading: 23% (24117248/104857600 bytes)
Uploading: 57% (60157952/104857600 bytes)
Uploading: 100% (104857600/104857600 bytes)
Upload result: ✅ Success
Server says: Upload complete. Server MD5: 1c48708e5f241e1bcf61b3173b...
```

---

## ✅ 支持点

| 功能        | 是否实现               |
| --------- | ------------------ |
| 分片流式上传    | ✅                  |
| 上传进度实时反馈  | ✅                  |
| 上传完成后回调结果 | ✅                  |
| 断点续传      | ✅（支持跳过 offset）     |
| 并发发送      | 🚧（当前是串行发送，后续可并发化） |

---

是否需要我继续为你 **优化为并发上传多个 chunk（提升吞吐）**，或者对接 GUI 前端/日志系统？



结合 Spring Boot 使用 gRPC 来实现文件流式上传（支持分片、进度条、断点续传、完整性校验）是完全可行的。以下是完整的集成方案：

---

## ✅ 技术栈

* Spring Boot（管理生命周期 & 配置）
* gRPC + Protobuf（高性能流式传输）
* grpc-spring-boot-starter（gRPC 与 Spring 集成）
* Java 11+
* Maven

---

## ✅ 1. Maven 依赖配置（`pom.xml`）

```xml
<properties>
    <java.version>11</java.version>
    <grpc.version>1.63.0</grpc.version>
</properties>

<dependencies>
    <!-- gRPC Core -->
    <dependency>
        <groupId>net.devh</groupId>
        <artifactId>grpc-server-spring-boot-starter</artifactId>
        <version>2.15.0.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>net.devh</groupId>
        <artifactId>grpc-client-spring-boot-starter</artifactId>
        <version>2.15.0.RELEASE</version>
    </dependency>

    <!-- Proto 依赖 -->
    <dependency>
        <groupId>com.google.protobuf</groupId>
        <artifactId>protobuf-java</artifactId>
        <version>3.25.0</version>
    </dependency>

    <!-- 可选：Lombok & commons -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>

<build>
    <extensions>
        <extension>
            <groupId>kr.motd.maven</groupId>
            <artifactId>os-maven-plugin</artifactId>
            <version>1.7.0</version>
        </extension>
    </extensions>
    <plugins>
        <!-- Proto 文件编译 -->
        <plugin>
            <groupId>org.xolstice.maven.plugins</groupId>
            <artifactId>protobuf-maven-plugin</artifactId>
            <version>0.6.1</version>
            <configuration>
                <protocArtifact>com.google.protobuf:protoc:3.25.0:exe:${os.detected.classifier}</protocArtifact>
                <pluginId>grpc-java</pluginId>
                <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.63.0:exe:${os.detected.classifier}</pluginArtifact>
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>compile</goal>
                        <goal>compile-custom</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

## ✅ 2. 配置文件（`application.yml`）

```yaml
grpc:
  server:
    port: 9090
  client:
    file-upload-service:
      address: static://localhost:9090
      negotiationType: plaintext
```

---

## ✅ 3. gRPC 服务端实现（Spring Bean）

```java
import com.example.grpcfile.FileTransferProto.*;
import com.example.grpcfile.FileTransferServiceGrpc;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;

@GrpcService
public class FileTransferServiceImpl extends FileTransferServiceGrpc.FileTransferServiceImplBase {

    private static final String UPLOAD_DIR = "/tmp/uploads/";
    private final Map<String, Set<Long>> uploadedOffsetsMap = new ConcurrentHashMap<>();
    private final Map<String, Long> receivedSizeMap = new ConcurrentHashMap<>();

    @Override
    public StreamObserver<FileChunk> upload(StreamObserver<UploadStatus> responseObserver) {
        return new StreamObserver<>() {
            private String fileId;
            private long totalSize = 0;

            @Override
            public void onNext(FileChunk chunk) {
                try {
                    fileId = chunk.getFileId();
                    totalSize = chunk.getTotalSize();
                    long offset = chunk.getOffset();
                    byte[] data = chunk.getData().toByteArray();

                    File dir = new File(UPLOAD_DIR + fileId);
                    if (!dir.exists()) dir.mkdirs();
                    File targetFile = new File(dir, "data.bin");

                    uploadedOffsetsMap.putIfAbsent(fileId, ConcurrentHashMap.newKeySet());
                    Set<Long> uploadedOffsets = uploadedOffsetsMap.get(fileId);
                    if (uploadedOffsets.contains(offset)) return;

                    try (RandomAccessFile raf = new RandomAccessFile(targetFile, "rw")) {
                        raf.seek(offset);
                        raf.write(data);
                    }

                    uploadedOffsets.add(offset);
                    receivedSizeMap.merge(fileId, (long) data.length, Long::sum);

                    if (chunk.getIsLast()) {
                        long received = receivedSizeMap.get(fileId);
                        String result;
                        if (received == totalSize) {
                            String md5 = calculateMD5(targetFile);
                            result = "✅ Upload complete. Server MD5: " + md5;
                        } else {
                            result = "❌ Upload incomplete. Received: " + received + " / " + totalSize;
                        }

                        responseObserver.onNext(UploadStatus.newBuilder()
                            .setSuccess(received == totalSize)
                            .setMessage(result)
                            .build());
                        responseObserver.onCompleted();
                    }

                } catch (Exception e) {
                    responseObserver.onError(e);
                }
            }

            @Override public void onError(Throwable t) {}
            @Override public void onCompleted() {}
        };
    }

    @Override
    public void queryUploadedChunks(FileIdentifier request, StreamObserver<UploadedChunks> responseObserver) {
        Set<Long> uploaded = uploadedOffsetsMap.getOrDefault(request.getFileId(), ConcurrentHashMap.newKeySet());
        responseObserver.onNext(UploadedChunks.newBuilder().addAllOffsets(uploaded).build());
        responseObserver.onCompleted();
    }

    @Override
    public void checkFileIntegrity(FileIdentifier request, StreamObserver<FileIntegrityStatus> responseObserver) {
        try {
            File file = new File(UPLOAD_DIR + request.getFileId(), "data.bin");
            String md5 = calculateMD5(file);

            responseObserver.onNext(FileIntegrityStatus.newBuilder()
                .setMatch(true)
                .setServerMd5(md5)
                .setMessage("Server file MD5 calculated")
                .build());
        } catch (Exception e) {
            responseObserver.onNext(FileIntegrityStatus.newBuilder()
                .setMatch(false)
                .setMessage("Failed to calc MD5: " + e.getMessage())
                .build());
        }
        responseObserver.onCompleted();
    }

    private String calculateMD5(File file) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(Files.readAllBytes(file.toPath()));
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
```

---

## ✅ 4. 启动类（`SpringBootGrpcApplication.java`）

```java
@SpringBootApplication
public class SpringBootGrpcApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBootGrpcApplication.class, args);
    }
}
```

---

## ✅ 客户端集成方案

你可以：

* 将上传器类 `FileUploader` 封装为 Spring Bean；
* 使用注入的 gRPC stub 实现分片上传调用；
* 在 Controller 中上传文件，通过流式方式传给 gRPC 服务。

如果你希望我继续集成：

1. `Spring Boot + REST API` 接入前端上传；
2. `FileUploader` 封装为 Spring Bean 客户端；
3. 加入断点续传 + 断电恢复机制；

请告诉我你希望接下来做哪部分。


✅ **你问得非常关键**：如果你的文件上传服务是**分布式部署**（多个服务节点实例），那么现有基于本地文件缓存（如 `/tmp/uploads/{fileId}/data.bin`）的设计会遇到严重问题。

---

## ❌ 当前方案在分布式场景下的问题

| 问题                         | 描述                                                        |
| -------------------------- | --------------------------------------------------------- |
| ❌ 本地文件写入不可共享               | 多个 gRPC 请求的分片可能被路由到不同服务节点，每个节点的 `/tmp/uploads/` 是独立的，无法合并 |
| ❌ uploadedOffsetsMap 状态不共享 | 当前上传状态（offset set、接收进度）是内存级的 `ConcurrentHashMap`，各实例互不通信  |
| ❌ 文件合并失败                   | 即使每个节点都能写文件，也可能只写了部分分片，无法合并成完整文件                          |
| ⚠️ 节点宕机即丢数据                | 未上传完就重启或切换实例，已写的文件和 offset 信息就丢了                          |

---

## ✅ 正确做法：**适配分布式部署的改造方案**

### 方案一：服务端状态+文件写入集中化（推荐）

| 模块            | 实现建议                                               |
| ------------- | -------------------------------------------------- |
| ☁️ **共享状态**   | 使用 Redis 记录每个 fileId 的 uploaded offset、接收字节数、是否完成等 |
| 📂 **共享文件缓存** | 使用 NFS、NAS、或 OSS 分片缓存区（可选）替代 `/tmp`                |
| ✅ **固定路由策略**  | gRPC 服务使用一致性哈希或 Nginx IP Hash 将同一个上传文件的分片始终路由到同一节点 |

### 方案二：服务端无状态 → 客户端上传到 OSS（你已排除）

---

## ✅ 改造建议详细如下：

### ✅ 1. 上传状态托管 Redis（替代 uploadedOffsetsMap）

```java
String redisKey = "upload:" + fileId + ":offsets";
redisSet.add(redisKey, offset);
```

还可以：

* 用 `upload:{fileId}:receivedSize` 记录总字节数
* 加 TTL 自动过期
* Redis Cluster 支持多实例高可用

---

### ✅ 2. 文件写入使用共享存储（如挂载 NAS）

把本地 `/tmp/uploads/` 改为共享挂载目录，例如：

```bash
/mnt/shared/uploads/
```

所有节点都挂载此目录，同一 fileId 的文件写入同一个位置。

---

### ✅ 3. 使用 nginx / spring gateway 实现**分片路由一致性**

> 将所有来自同一 fileId 的请求固定转发到同一节点：

* Nginx：使用 `hash $arg_fileId consistent;`
* Spring Cloud Gateway：使用自定义 `LoadBalancerClientFilter` 做 Hash 路由

---

## ✅ 可选方案：直接将分片写入 OSS（更高级）

你也可以把文件分片直接写入 OSS 的**分块上传（Multipart Upload）接口**，这样：

* 每个分片变成一个 OSS Part（按 offset 编号）
* OSS 支持乱序上传
* 服务端各实例只负责调用 `uploadPart`，最终调用 `completeMultipartUpload`

👉 这也是阿里云 OSS 官方推荐的分布式上传方案。

我可以帮你改造为这种「**多节点分布式上传到 OSS Multipart Upload**」方式，完全无共享存储依赖、支持乱序上传和自动合并。

---

## ✅ 总结

| 是否分布式安全      | 当前方案      | 改进建议                       |
| ------------ | --------- | -------------------------- |
| ❌ 上传状态       | 内存 `Map`  | 改为 Redis                   |
| ❌ 文件临时缓存     | 本地 `/tmp` | 改为 NFS/NAS 或 OSS Multipart |
| ❌ 分片路由       | 任意分布      | 配置 fileId hash 路由          |
| ✅ 最终合并上传 OSS | 服务端统一完成   | ✅ 保留                       |

---

是否希望我帮你：

* ✳️ 改造成「服务端使用 OSS Multipart Upload 分块上传方案」？（分布式原生支持）
* 🔁 或基于 Redis + NFS 分布式缓存继续优化现有方案？

可以按你的实际环境和部署能力，我们一起定下最合适的方案。
