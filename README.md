>基于MQTT协议微信小程序`4.0`全量发布。支持多种设备接入，轻松方便实现远控控制设备。

# 支持设备
- 支持温度、湿度数据接入。
- 支持开关设备接入。
- 支持水质、土壤、风速等传感器接入。
- 支持`Ws2812b`灯带接入和控制。
- 支持对伺服电机、马达设备控制。


# 数据说明
目前所有数据优先支持`json`数据。部分设备类型支持命令。

**温湿度**
```
{"humi":42,"temp":5}
```
**开关类**
```
#开灯
{"led": true}
#关灯
{"led": false}
```
对于开关类型，我们还可以控制伺服舵机按对应角度旋转。
```
#旋转90°
servo90
#旋转复位
servo0
```
当然，也可以直接发送`1`或者`0`实现对设备的开启/关闭。但需要写好相关控制代码。

**水质传感器**

数据格式：
```
{"TDS":21,"DJ":"优"}
```

**风速传感器**

构建数据格式为：
```
{"FS":1.3,"FDJ":"轻风"}
```
**土壤传感器**
```
{"TR":1.3"}
```
当然，可以将数据整合。完整的数据格式示例：
```
{"humi": 35, "temp": 20.20,"TDS":21,"DJ":"优","FS":1.3,"FDJ":"轻风","TR":1.3}
```

![](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018190614.png)

**Ws2812b灯带控制** 
```
# 开灯
{"state":"ON"}
# 关灯
{"state":"OFF"}
# 颜色设置
{"color":{"r":155,"g":158,"b":243}}
# 亮度
{"state":"ON"}
```
视频效果演示

1

**马达控制**

向对应的主题发送`{"on":"1", "duration":5} ` 表示电机正转5s 。发送 `{"on":"0", "duration":5} `表示反转5s ，若`duration为0`则表示一直运行。`{"on":"1", "duration":0}`或 `{"on":"1"}`表示一直正转。`{"on":"0", "duration":0}`或`{"on":"0"}`表示一直反转。发送`{"off":true}`表示停止转动。


![](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018191147.png)

电机控制，支持快捷按钮（正转5s、反转5s、持续正转、持续反转）和用户自定义控制两部分。

如果要修改快捷时间5s为10s，可以修改`pages/index/index.js`文件中的`motorDuration: 5 `参数。


![](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018191657.png)

视频演示效果

1
# 与HomeAssistant同步
因为是基于MQTT协议，值得高兴的是，你的设备可以与HA共同协调。

![HA中控制电机](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018191959.png)


![](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018192236.png)


![温湿度效果](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018192049.png)


![Ws2812b灯带控制-](https://xiaoyaozi666.oss-cn-beijing.aliyuncs.com/image_20251018192118.png)

# 注意事项
- 务必修改为自己的appid
- 务必搭建自己的MQTT服务器并配置wss
- 需要备案域名

# 详情访问微信公众号 Kali笔记
