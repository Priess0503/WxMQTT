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

<section class="_135editor" draggable="true" data-tools="135编辑器" data-id="119081"><section style="margin: 10px auto; transform-style: preserve-3d;"><section style="display: flex;justify-content: center;transform: translateZ(10px)"><section><section style="font-size: 14px;color: #d4d4d4;text-align: center;"><strong class="135brush" data-brushtype="text">BREAK AWAY</strong></section><section style="display: flex;justify-content: center;"><section style="font-size: 16px;color: #ffffff;text-align: center;background-color: #ffc955;border-radius: 25px;padding: 4px 25px;letter-spacing: 1.5px;"><strong class="135brush" data-brushtype="text">往期推荐</strong></section></section></section></section><section style="background-color: #f5faff;padding: 20px 15px 15px;border-radius: 7px;margin: -15px 0 0 0;transform: translateZ(5px)"><section class="box-edit" style="background-color: #ffffff;border-radius: 7px;display: flex;justify-content: flex-start;align-items: center;padding: 10px 10px 10px 5px;margin: 10px 0;"><section style="flex-shrink: 0;"><section style="box-sizing:border-box;font-size: 16px;letter-spacing: 1.5px;color: #80b4ff;width: 40px;height: 40px;text-align: center;line-height: 40px;border-right: 1px dashed #80b4ff;"><strong>0</strong><strong class="autonum">1</strong></section></section><section style="box-sizing:border-box;max-width: 100% !important;width: 100%;"><section style="font-size: 14px;color: #333333;text-align: left;letter-spacing: 1.5px;padding: 0 0 0 10px;"><span class="135brush" data-brushtype="text">微信公众号纸团样式使用教程</span></section></section></section><section class="box-edit" style="background-color: #ffffff;border-radius: 7px;display: flex;justify-content: flex-start;align-items: center;padding: 10px 10px 10px 5px;margin: 10px 0;"><section style="flex-shrink: 0;"><section style="box-sizing:border-box;font-size: 16px;letter-spacing: 1.5px;color: #80b4ff;width: 40px;height: 40px;text-align: center;line-height: 40px;border-right: 1px dashed #80b4ff;"><strong>0</strong><strong class="autonum">2</strong></section></section><section style="box-sizing:border-box;max-width: 100% !important;width: 100%;"><section style="font-size: 14px;color: #333333;text-align: left;letter-spacing: 1.5px;padding: 0 0 0 10px;"><span class="135brush" data-brushtype="text">公众号名称如何修改，有什么注意事项</span></section></section></section><section class="box-edit" style="background-color: #ffffff;border-radius: 7px;display: flex;justify-content: flex-start;align-items: center;padding: 10px 10px 10px 5px;margin: 10px 0;"><section style="flex-shrink: 0;"><section style="box-sizing:border-box;font-size: 16px;letter-spacing: 1.5px;color: #80b4ff;width: 40px;height: 40px;text-align: center;line-height: 40px;border-right: 1px dashed #80b4ff;"><strong>0</strong><strong class="autonum">3</strong></section></section><section style="box-sizing:border-box;max-width: 100% !important;width: 100%;"><section style="font-size: 14px;color: #333333;text-align: left;letter-spacing: 1.5px;padding: 0 0 0 10px;"><span class="135brush" data-brushtype="text">如何正确转载公众号文章？这几点一定要认真注意！</span></section></section></section></section></section></section>
