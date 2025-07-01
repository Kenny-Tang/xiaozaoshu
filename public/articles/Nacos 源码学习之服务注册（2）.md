*不积跬步，无以至千里；不积细流，无以成江河*

Nacos 是阿里巴巴开源的一个动态服务发现、配置和服务管理平台，提供了云原生应用的服务治理解决方案。Nacos 的客户端代码主要用于与 Nacos 服务器进行交互，提供服务注册、发现、配置管理等功能。

调用流程如图所示

![723832846258786314.png](723832846258786314.png)

这里我们首先学习 *Nacos* 的服务的注册和发现的功能， 服务注册和服务发现是微服务架构中非常重要的功能，Nacos 提供了简单易用的 API 来实现这些功能。

在前一篇的博文中，我们已经分析了服务注册请求的发送过程，

在 `doRegisterService` 方法中，首先创建了一个 `InstanceRequest` 请求对象,将要注册服务的信息封装，然后调用 `requestToServer` 方法向 Nacos 服务器发送注册请求。

现在我们在 Server 端的代码中进行分析，看看 Nacos 是如何处理这个注册请求的。

`InstanceRequestHandler` 类是处理实例请求的核心类，它负责处理服务的注册、注销。

在 `InstanceRequestHandler` 类中，处理注册请求的主要方法是 `handle` 方法。

```java
    public InstanceResponse handle(InstanceRequest request, RequestMeta meta) throws NacosException {
        Service service = Service.newService(request.getNamespace(), request.getGroupName(), request.getServiceName(),
                true);
        InstanceUtil.setInstanceIdIfEmpty(request.getInstance(), service.getGroupedServiceName());
        switch (request.getType()) {
            case NamingRemoteConstants.REGISTER_INSTANCE:
                return registerInstance(service, request, meta);
            case NamingRemoteConstants.DE_REGISTER_INSTANCE:
                return deregisterInstance(service, request, meta);
            default:
                throw new NacosException(NacosException.INVALID_PARAM,
                        String.format("Unsupported request type %s", request.getType()));
        }
    }
```

在 `handle` 方法中，首先创建了一个 `Service` 对象，表示要注册的服务。然后根据请求类型调用不同的方法进行处理。

如果请求类型是 `REGISTER_INSTANCE`，则调用 `registerInstance` 方法进行服务注册；如果请求类型是 `DE_REGISTER_INSTANCE`，则调用 `deregisterInstance` 方法进行服务注销。

接下来我们分析 `registerInstance` 方法，它是处理服务注册的核心方法。
```java 
    private InstanceResponse registerInstance(Service service, InstanceRequest request, RequestMeta meta)
            throws NacosException {
        clientOperationService.registerInstance(service, request.getInstance(), meta.getConnectionId());
        NotifyCenter.publishEvent(new RegisterInstanceTraceEvent(System.currentTimeMillis(),
                NamingRequestUtil.getSourceIpForGrpcRequest(meta), true, service.getNamespace(), service.getGroup(),
                service.getName(), request.getInstance().getIp(), request.getInstance().getPort()));
        return new InstanceResponse(NamingRemoteConstants.REGISTER_INSTANCE);
    }
```
接着代码来到了 `EphemeralClientOperationServiceImpl.registerInstance(service, request.getInstance(), meta.getConnectionId());` 来进行处理, 处理完成后发布了一个 `RegisterInstanceTraceEvent` 事件。

具体实现如下：

```java
    @Override
    public void registerInstance(Service service, Instance instance, String clientId) throws NacosException {
        NamingUtils.checkInstanceIsLegal(instance);
    
        Service singleton = ServiceManager.getInstance().getSingleton(service);
        if (!singleton.isEphemeral()) {
            throw new NacosRuntimeException(NacosException.INVALID_PARAM,
                    String.format("Current service %s is persistent service, can't register ephemeral instance.",
                            singleton.getGroupedServiceName()));
        }
        Client client = clientManager.getClient(clientId);
        checkClientIsLegal(client, clientId);
        InstancePublishInfo instanceInfo = getPublishInfo(instance);
        client.addServiceInstance(singleton, instanceInfo);
        client.setLastUpdatedTime();
        client.recalculateRevision();
        NotifyCenter.publishEvent(new ClientOperationEvent.ClientRegisterServiceEvent(singleton, clientId));
        NotifyCenter
                .publishEvent(new MetadataEvent.InstanceMetadataEvent(singleton, instanceInfo.getMetadataId(), false));
    }
```
`service` 参数是要注册的服务，`instance` 参数是要注册服务对应的一个实例，`clientId` 是客户端的连接 ID。

`InstancePublishInfo instanceInfo = getPublishInfo(instance);` 将客户端请求的实例信息转换为 `InstancePublishInfo` 对象。
然后调用 `client.addServiceInstance(singleton, instanceInfo);` 将实例信息添加到客户端的服务实例列表中，添加完成后又发布了一个 `ClientOperationEvent.ClientRegisterServiceEvent` 事件和一个 `MetadataEvent.InstanceMetadataEvent` 事件。

```java 
    @Override
    public boolean addServiceInstance(Service service, InstancePublishInfo instancePublishInfo) {
        if (instancePublishInfo instanceof BatchInstancePublishInfo) {
            InstancePublishInfo old = publishers.put(service, instancePublishInfo);
            MetricsMonitor.incrementIpCountWithBatchRegister(old, (BatchInstancePublishInfo) instancePublishInfo);
        } else {
            if (null == publishers.put(service, instancePublishInfo)) {
                MetricsMonitor.incrementInstanceCount();
            }
        }
        NotifyCenter.publishEvent(new ClientEvent.ClientChangedEvent(this));
        Loggers.SRV_LOG.info("Client change for service {}, {}", service, getClientId());
        return true;
    }
```
在 `addServiceInstance` 方法中，添加后还发布了一个 `ClientEvent.ClientChangedEvent` 事件，表示客户端的服务实例列表发生了变化。

到这里整个注册的方法已经完了，其中代码的整体流程已经完成了，但是目前为止我们还没有看到 Nacos 是如何将这个注册的服务信息进行实际的处理的，具体的处理逻辑在发布的时间中进行了异步处理。


接下来我们分析这些事件是如何处理的。
 - MetadataEvent.ServiceMetadataEvent(service, false)
 - ClientEvent.ClientChangedEvent(this)
 - ClientOperationEvent.ClientRegisterServiceEvent
   (singleton, clientId))
 - MetadataEvent.InstanceMetadataEvent
   (singleton, instanceInfo.getMetadataId(), false)

### MetadataEvent.ServiceMetadataEvent
`MetadataEvent.ServiceMetadataEvent` 事件是一个元数据事件，它在服务的元数据发生变化时发布。这个事件的处理逻辑主要在 `NamingMetadataManager` 中实现。

```java
    private void handleServiceMetadataEvent(MetadataEvent.ServiceMetadataEvent event) {
        Service service = event.getService();
        if (containServiceMetadata(service)) {
            updateExpiredInfo(event.isExpired(), ExpiredMetadataInfo.newExpiredServiceMetadata(service));
        }
    }
```
在 `handleServiceMetadataEvent` 方法中，首先获取事件中的服务对象，然后检查 ***ConcurrentMap<Service, ServiceMetadata> serviceMetadataMap;*** 是否包含该服务的元数据，如果包含，则更新过期信息。
如果事件是过期的，则创建一个新的 `ExpiredMetadataInfo` 对象，并将其添加到过期信息列表（ ***Set<ExpiredMetadataInfo> expiredMetadataInfos*** ）中。要是没有过期，则从过期信息列表中移除该服务的元数据。

```java
    private void updateExpiredInfo(boolean isExpired, ExpiredMetadataInfo expiredInfo) {
        if (isExpired) {
            expiredServiceMetadata.add(expiredInfo);
        } else {
            expiredServiceMetadata.remove(expiredInfo);
        }
    }
```

### ClientEvent.ClientChangedEvent(this)
`ClientEvent.ClientChangedEvent` 事件是一个客户端变更事件，它在客户端的服务实例列表发生变化时发布。这个事件的处理逻辑主要在 `DistroClientDataProcessor` 中实现。

```java
    private void syncToAllServer(ClientEvent event) {
        Client client = event.getClient();
        if (isInvalidClient(client)) {
            return;
        }
        if (event instanceof ClientEvent.ClientDisconnectEvent) {
            DistroKey distroKey = new DistroKey(client.getClientId(), TYPE);
            distroProtocol.sync(distroKey, DataOperation.DELETE);
        } else if (event instanceof ClientEvent.ClientChangedEvent) {
            DistroKey distroKey = new DistroKey(client.getClientId(), TYPE);
            distroProtocol.sync(distroKey, DataOperation.CHANGE);
        }
    }
```
在 `distroProtocol.sync` 方法中，会遍历 **集群中的其他成员** ，然后调用 `syncToTarget` 方法将数据同步给集群的其他节点。

```java
    public void syncToTarget(DistroKey distroKey, DataOperation action, String targetServer, long delay) {
        DistroKey distroKeyWithTarget = new DistroKey(distroKey.getResourceKey(), distroKey.getResourceType(),
                targetServer);
        DistroDelayTask distroDelayTask = new DistroDelayTask(distroKeyWithTarget, action, delay);
        distroTaskEngineHolder.getDelayTaskExecuteEngine().addTask(distroKeyWithTarget, distroDelayTask);
        if (Loggers.DISTRO.isDebugEnabled()) {
            Loggers.DISTRO.debug("[DISTRO-SCHEDULE] {} to {}", distroKey, targetServer);
        }
    }
```

### ClientOperationEvent.ClientRegisterServiceEvent
`ClientOperationEvent.ClientRegisterServiceEvent` 事件是一个客户端操作事件，它在客户端注册服务时发布。这个事件的处理逻辑主要在 `ClientServiceIndexesManager` 中实现。

```java
    private void handleClientOperation(ClientOperationEvent event) {
        Service service = event.getService();
        String clientId = event.getClientId();
        if (event instanceof ClientOperationEvent.ClientRegisterServiceEvent) {
            addPublisherIndexes(service, clientId); // 添加发布者索引
        } else if (event instanceof ClientOperationEvent.ClientDeregisterServiceEvent) {
            removePublisherIndexes(service, clientId); // 移除发布者索引
        } else if (event instanceof ClientOperationEvent.ClientSubscribeServiceEvent) {
            addSubscriberIndexes(service, clientId); // 添加订阅者索引
        } else if (event instanceof ClientOperationEvent.ClientUnsubscribeServiceEvent) {
            removeSubscriberIndexes(service, clientId); // 移除订阅者索引
        }
    }
```

在 `handleClientOperation` 方法中，根据事件类型判断是注册、注销、订阅还是取消订阅操作，然后调用相应的方法进行处理, 其中注册操作调用了 `addPublisherIndexes` 方法。
实现逻辑如下，很简单只有两行代码，首先把 Service 当做key， clientId 当做 value 存入到 `publisherIndexes` 中，然后发布一个 `ServiceEvent.ServiceChangedEvent` 事件。
`publisherIndexes` 是一个实现声明的Map, `ConcurrentMap<Service, Set<String>> publisherIndexes`

```java
    private void addPublisherIndexes(Service service, String clientId) {
        publisherIndexes.computeIfAbsent(service, key -> new ConcurrentHashSet<>()).add(clientId);
        NotifyCenter.publishEvent(new ServiceEvent.ServiceChangedEvent(service, true));
    }
```




### MetadataEvent.InstanceMetadataEvent
`MetadataEvent.InstanceMetadataEvent` 事件是一个实例元数据事件，它在实例的元数据发生变化时发布。这个事件的处理逻辑同 `MetadataEvent.ServiceMetadataEvent` 一样，主要在 `NamingMetadataManager` 中实现。

```java
    private void handleInstanceMetadataEvent(MetadataEvent.InstanceMetadataEvent event) {
        Service service = event.getService();
        String metadataId = event.getMetadataId();
        if (containInstanceMetadata(service, metadataId)) {
            updateExpiredInfo(event.isExpired(),
                    ExpiredMetadataInfo.newExpiredInstanceMetadata(event.getService(), event.getMetadataId()));
        }
    }
```
在 `handleInstanceMetadataEvent` 方法中，首先获取事件中的服务对象和元数据 ID，然后检查 `ConcurrentMap<Service, Map<String, InstanceMetadata>> instanceMetadataMap` 是否包含该服务的实例元数据，如果包含，则更新过期信息。
如果事件是过期的，则创建一个新的 `ExpiredMetadataInfo` 对象，并将其添加到过期信息列表（ ***Set<ExpiredMetadataInfo> expiredInstanceMetadata*** ）中。要是没有过期，则从过期信息列表中移除该服务的实例元数据。

```java
    private void updateExpiredInfo(boolean isExpired, ExpiredMetadataInfo expiredInfo) {
        if (isExpired) {
            expiredInstanceMetadata.add(expiredInfo);
        } else {
            expiredInstanceMetadata.remove(expiredInfo);
        }
    }
```