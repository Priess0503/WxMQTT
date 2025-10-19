var mqtt = require('../../utils/mqtt.min.js');
var client = null;
var id = 'wsy' + Math.ceil(Math.random() * 10);

function formatTime(timestamp, type = 'time') {
    const date = new Date(timestamp);
    if (type === 'time') {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }
}

Page({
    data: {
        devices: [],
        deviceData: {}, // 存储每个设备的最新数据
        historyData: {}, // 存储每个设备的历史数据
        selectedDevice: null,
        timeRange: 'day', // 'day' or 'week'
        mqttStatus: {
            connected: false,
            connecting: false
        },
        mqttReconnecting: false, // 添加重连状态标记
        // LED控制相关数据
        showLedDialog: false,
        currentLedDevice: null,
        ledBrightness: 100,
        ledColor: { r: 255, g: 255, b: 255 },
        quickColors: [
            { color: '#ff0000', rgb: { r: 255, g: 0, b: 0 } },
            { color: '#ff8000', rgb: { r: 255, g: 128, b: 0 } },
            { color: '#ffff00', rgb: { r: 255, g: 255, b: 0 } },
            { color: '#00ff00', rgb: { r: 0, g: 255, b: 0 } },
            { color: '#00ffff', rgb: { r: 0, g: 255, b: 255 } },
            { color: '#0000ff', rgb: { r: 0, g: 0, b: 255 } },
            { color: '#8000ff', rgb: { r: 128, g: 0, b: 255 } },
            { color: '#ff00ff', rgb: { r: 255, g: 0, b: 255 } },
            { color: '#ffffff', rgb: { r: 255, g: 255, b: 255 } }
        ],
        showChart: true, // 控制折线图的显示/隐藏
        // 电机控制相关数据
        showMotorDialog: false,
        currentMotorDevice: null,
        motorDirection: 'forward', // 'forward' 或 'reverse'
        motorDirectionIndex: 0,
        motorDirections: [
            { text: '正转', value: 'forward' },
            { text: '反转', value: 'reverse' }
        ],
        motorDuration: 5 // 运行时间（秒）
    },

    onLoad() {
        // 从本地存储加载设备配置和历史数据
        const devices = wx.getStorageSync('devices') || [];
        const historyData = wx.getStorageSync('historyData') || {};
        
        // 初始化设备数据，确保开关、LED和电机设备有默认状态
        const deviceData = wx.getStorageSync('deviceData') || {};
        devices.forEach(device => {
            if (device.type === 'switch' || device.type === 'led' || device.type === 'motor') {
                // 从本地存储加载开关状态，默认为关闭
                const savedState = wx.getStorageSync(`device_state_${device.id}`);
                deviceData[device.id] = savedState !== undefined ? savedState : false;
            }
        });
        
        // 初始化选中的设备
        if (devices.length > 0) {
            const selectedDevice = devices[0];
            const currentData = historyData[selectedDevice.id] || {};
            if (currentData.value) {
                selectedDevice.currentValue = currentData.value.toFixed(1);
            }
            
            // 判断设备类型，决定是否显示折线图
            const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
            const isSensorDevice = sensorTypes.includes(selectedDevice.type);
            const shouldShowChart = isSensorDevice;
            
            this.setData({ 
                devices,
                selectedDevice,
                historyData,
                deviceData, // 添加设备数据
                showChart: shouldShowChart // 根据设备类型决定是否显示折线图
            });
        } else {
            this.setData({ 
                devices,
                historyData,
                deviceData, // 添加设备数据
                showChart: false // 没有设备时不显示图表
            });
        }
        
        if (devices.length > 0) {
            this.connectMqtt();
        }

        // 定期清理过期数据
        this.cleanExpiredData();
    },

    // 清理过期数据
    cleanExpiredData() {
        const { historyData } = this.data;
        const now = new Date().getTime();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        let hasChanges = false;
        for (const deviceId in historyData) {
            if (Array.isArray(historyData[deviceId])) {
                const filteredData = historyData[deviceId].filter(item => item.timestamp > oneWeekAgo);
                if (filteredData.length !== historyData[deviceId].length) {
                    historyData[deviceId] = filteredData;
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            this.setData({ historyData });
            wx.setStorageSync('historyData', historyData);
        }
    },

    // 切换设备
    onDeviceSelect(e) {
        const { id } = e.currentTarget.dataset;
        console.log('切换设备，设备ID:', id);
        console.log('当前设备列表:', this.data.devices);
        
        // 首先尝试通过ID查找设备
        let selectedDevice = this.data.devices.find(device => device.id === id);
        
        // 如果通过ID找不到，尝试通过其他方式查找
        if (!selectedDevice) {
            console.error('未找到设备:', id);
            console.error('可用的设备ID:', this.data.devices.map(d => d.id));
            
            // 尝试通过设备名称查找（如果ID是时间戳格式）
            const timestampId = parseInt(id);
            if (!isNaN(timestampId)) {
                console.log('尝试通过时间戳ID查找设备');
                // 这里可以添加其他查找逻辑，比如通过设备名称等
            }
            
            return;
        }
        
        console.log('选中的设备:', selectedDevice);
        
        // 判断设备类型，决定是否显示折线图
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = sensorTypes.includes(selectedDevice.type);
        const shouldShowChart = isSensorDevice;
        
        console.log('设备类型判断:', {
            deviceType: selectedDevice.type,
            isSensorDevice,
            shouldShowChart
        });
        
        // 获取设备的当前值（仅对传感器设备）
        if (isSensorDevice) {
            // 优先从deviceData获取最近的数据
            const currentDeviceData = this.data.deviceData[id];
            if (currentDeviceData && currentDeviceData.value !== undefined) {
                selectedDevice.currentValue = currentDeviceData.value.toFixed(1);
                console.log('从deviceData获取设备当前值:', selectedDevice.currentValue);
                
                // 恢复质量信息
                if (selectedDevice.type === 'waterquality' && currentDeviceData.quality) {
                    selectedDevice.quality = currentDeviceData.quality;
                    console.log('恢复水质传感器质量:', selectedDevice.quality);
                } else if (selectedDevice.type === 'fengsu' && currentDeviceData.FDJ) {
                    selectedDevice.FDJ = currentDeviceData.FDJ;
                    console.log('恢复风速传感器风等级:', selectedDevice.FDJ);
                }
            } else {
                // 如果没有deviceData，尝试从historyData获取
                const currentData = this.data.historyData[id];
                if (currentData && currentData.value !== undefined) {
                    selectedDevice.currentValue = currentData.value.toFixed(1);
                    console.log('从historyData获取设备当前值:', selectedDevice.currentValue);
                } else {
                    selectedDevice.currentValue = '--';
                    console.log('设备无数据，设置为默认值');
                }
            }
        } else {
            // 对于灯带和开关设备，设置默认值
            selectedDevice.currentValue = '--';
            console.log('非传感器设备，设置默认值');
        }
        
        this.setData({ 
            selectedDevice,
            showChart: shouldShowChart // 根据设备类型决定是否显示折线图
        });
        
        // 只有传感器设备才更新图表
        if (shouldShowChart) {
            // 延迟更新图表，确保DOM更新完成
            setTimeout(() => {
                try {
                    this.updateChart();
                    console.log('图表更新完成');
                } catch (error) {
                    console.error('更新图表失败:', error);
                }
            }, 100);
        } else {
            console.log('设备不是传感器类型，跳过图表更新');
        }
    },

    // 切换时间范围
    onTimeRangeChange(e) {
        const range = e.currentTarget.dataset.range;
        this.setData({ timeRange: range });
        
        // 只有传感器设备才更新图表
        const { selectedDevice } = this.data;
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = selectedDevice ? sensorTypes.includes(selectedDevice.type) : false;
        
        if (isSensorDevice) {
            this.updateChart();
        }
    },

    // 连接MQTT
    connectMqtt() {
        const that = this;
        const mqttConfig = wx.getStorageSync('mqttConfig');
        
        if (!mqttConfig || !mqttConfig.host) {
            wx.showToast({
                title: '请先配置MQTT服务器',
                icon: 'none'
            });
            return;
        }

        // 防止重复连接
        if (that.data.mqttStatus.connecting) {
            console.log('MQTT正在连接中，跳过重复连接');
            return;
        }

        // 如果已经存在连接，先断开
        if (client) {
            console.log('断开现有MQTT连接');
            client.end(true);
            client = null;
        }

        // 生成更稳定的客户端ID
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 8);
        const clientId = `wx_${timestamp}_${randomStr}`;
        console.log('Client ID:', clientId);

        const options = {
            connectTimeout: 30000,        // 增加连接超时时间到30秒
            clientId: clientId,
            port: 8084,
            username: mqttConfig.username,
            password: mqttConfig.password,
            keepalive: 1200,              // 增加keepalive到20分钟
            clean: true,                  // 改为true，每次连接都是新会话
            reconnectPeriod: 0,           // 禁用自动重连
            resubscribe: false,           // 禁用自动重订阅
            protocolVersion: 4,          // 明确指定MQTT协议版本
            queueQoSZero: false,         // 不排队QoS 0消息
            rejectUnauthorized: false,   // 允许自签名证书
            incomingStore: null,         // 禁用消息存储
            outgoingStore: null,        // 禁用消息存储
            transformWsUrl: (url, options, client) => {
                // 确保WebSocket URL格式正确
                return url.replace('wxs://', 'wss://');
            }
        };

        const url = `wxs://${mqttConfig.host}/mqtt`;
        console.log('正在连接到：', url);
        
        that.setData({
            'mqttStatus.connecting': true,
            'mqttStatus.connected': false,
            mqttReconnecting: false
        });

        try {
            client = mqtt.connect(url, options);


            // 添加消息处理
            client.on('message', (topic, message) => {
                try {
                    console.log('收到消息，主题:', topic);
                    // 直接解析JSON字符串
                    const data = JSON.parse(message.toString());
                    console.log('解析后的数据:', data);

                    // 验证数据格式
                    if (typeof data !== 'object' || data === null) {
                        console.error('无效的数据格式:', data);
                        return;
                    }

                    // 检查必要的字段
                    if (data.temp === undefined && data.TR === undefined && data.FS === undefined && data.humi === undefined && data.TDS === undefined) {
                        console.error('缺少必要的数据字段:', data);
                        return;
                    }

                    // 确保数据是数字类型
                    if (data.temp !== undefined) {
                        data.temp = parseFloat(data.temp);
                    }
                    if (data.humi !== undefined) {
                        data.humi = parseFloat(data.humi);
                    }
                    if (data.TDS !== undefined) {
                        data.TDS = parseFloat(data.TDS);
                    }
                    if (data.TR !== undefined) {
                      data.TR = parseFloat(data.TR);
                    }
                    if (data.FS !== undefined) {
                      data.FS = parseFloat(data.FS);
                    }

                    // 根据主题找到对应的设备
                    const devices = that.data.devices;
                    console.log('当前设备列表:', devices);
                    
                    // 遍历所有使用该主题的设备
                    devices.forEach(device => {
                        if (device.topic === topic) {
                            console.log('找到匹配的设备:', device);
                            // 更新设备数据
                            if (device.type === 'temperature' && data.temp !== undefined) {
                                const tempValue = parseFloat(data.temp);
                                console.log('更新温度数据:', tempValue, '设备ID:', device.id);
                                that.updateDeviceData(device.id, tempValue);
                            } else if (device.type === 'humidity' && data.humi !== undefined) {
                                const humiValue = parseFloat(data.humi);
                                console.log('更新湿度数据:', humiValue, '设备ID:', device.id);
                                that.updateDeviceData(device.id, humiValue);
                            } else if (device.type === 'waterquality' && data.TDS !== undefined) {
                                const tdsValue = parseFloat(data.TDS);
                                console.log('更新水质数据:', tdsValue, '设备ID:', device.id);
                                that.updateDeviceData(device.id, tdsValue, data.DJ);
                            } else if (device.type === 'turang' && data.TR !== undefined) {
                              const trValue = parseFloat(data.TR);
                              console.log('更新土壤数据:', trValue, '设备ID:', device.id);
                              that.updateDeviceData(device.id, trValue);
                            } else if (device.type === 'fengsu' && data.FS !== undefined) {
                              const fsValue2 = parseFloat(data.FS);
                              console.log('更新风速数据:', fsValue2, '设备ID:', device.id);
                              that.updateDeviceData(device.id, fsValue2, data.FDJ);  // 添加 FDJ 作为第三个参数
                          }
                        }
                    });
                } catch (error) {
                    console.error('解析消息失败:', error);
                    console.log('原始消息:', message.toString());
                }
            });


            client.on('error', (error) => {
                console.error('MQTT连接错误:', error);
                that.setData({
                    'mqttStatus.connected': false,
                    'mqttStatus.connecting': false
                });
                
                // 延迟重连，避免立即重连
                setTimeout(() => {
                    if (!that.data.mqttStatus.connected) {
                        manualReconnect();
                    }
                }, 2000);
            });

            client.on('close', () => {
                console.log('MQTT连接已关闭');
                that.setData({
                    'mqttStatus.connected': false,
                    'mqttStatus.connecting': false
                });
                
                // 延迟重连，避免立即重连
                setTimeout(() => {
                    if (!that.data.mqttStatus.connected) {
                        manualReconnect();
                    }
                }, 2000);
            });

            client.on('offline', () => {
                console.log('MQTT连接离线');
                that.setData({
                    'mqttStatus.connected': false,
                    'mqttStatus.connecting': false
                });
                
                // 延迟重连，避免立即重连
                setTimeout(() => {
                    if (!that.data.mqttStatus.connected) {
                        manualReconnect();
                    }
                }, 2000);
            });

            // 添加连接断开事件处理
            client.on('disconnect', () => {
                console.log('MQTT连接断开');
                that.setData({
                    'mqttStatus.connected': false,
                    'mqttStatus.connecting': false
                });
                
                // 延迟重连，避免立即重连
                setTimeout(() => {
                    if (!that.data.mqttStatus.connected) {
                        manualReconnect();
                    }
                }, 2000);
            });

            // 手动重连机制
            let heartbeatTimer = null;
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 2; // 减少最大重连次数
            
            const manualReconnect = () => {
                // 检查是否已经在连接中或重连中
                if (that.data.mqttStatus.connecting || that.data.mqttReconnecting) {
                    console.log('MQTT正在连接或重连中，跳过重连');
                    return;
                }
                
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`MQTT手动重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
                    
                    // 设置重连状态
                    that.setData({
                        mqttReconnecting: true
                    });
                    
                    setTimeout(() => {
                        that.connectMqtt();
                    }, 10000); // 增加到10秒后重连
                } else {
                    console.log('MQTT重连次数超限，停止重连');
                    that.setData({
                        mqttReconnecting: false
                    });
                    wx.showToast({
                        title: 'MQTT连接失败',
                        icon: 'none',
                        duration: 3000
                    });
                }
            };
            
            const startHeartbeat = () => {
                if (heartbeatTimer) {
                    clearInterval(heartbeatTimer);
                }
                heartbeatTimer = setInterval(() => {
                    if (client && client.connected) {
                        console.log('MQTT心跳检测: 连接正常');
                        reconnectAttempts = 0; // 重置重连计数
                    } else {
                        console.log('MQTT心跳检测: 连接异常');
                        manualReconnect();
                    }
                }, 600000); // 每10分钟检测一次
            };

            // 连接成功后启动心跳检测
            client.on('connect', () => {
                console.log('MQTT服务器连接成功');
                reconnectAttempts = 0; // 重置重连计数
                that.setData({
                    'mqttStatus.connected': true,
                    'mqttStatus.connecting': false,
                    mqttReconnecting: false // 重置重连状态
                });

                // 启动心跳检测
                startHeartbeat();

                // 获取用户添加的设备列表
                const devices = that.data.devices;
                console.log('当前设备列表:', devices);

                // 订阅每个设备的主题
                devices.forEach(device => {
                    if (device.type !== 'switch' && device.type !== 'led' && device.type !== 'motor' && device.topic) {
                        console.log('正在订阅主题:', device.topic);
                        client.subscribe(device.topic, { qos: 0 }, (err) => {
                            if (!err) {
                                console.log('订阅成功:', device.topic);
                            } else {
                                console.error('订阅失败:', device.topic, err);
                                setTimeout(() => {
                                    if (client && client.connected) {
                                        client.subscribe(device.topic);
                                    }
                                }, 3000);
                            }
                        });
                    }
                });
            });

            // 处理页面隐藏和显示
            wx.onAppHide(() => {
                console.log('页面隐藏，保持MQTT连接');
                // 不主动断开连接，保持连接状态
                if (heartbeatTimer) {
                    clearInterval(heartbeatTimer);
                    heartbeatTimer = null;
                }
            });

            wx.onAppShow(() => {
                console.log('页面显示，检查MQTT连接状态');
                if (!client || !client.connected) {
                    if (that.data.devices.length > 0) {
                        console.log('MQTT未连接，尝试重连');
                        that.connectMqtt();
                    }
                } else {
                    console.log('MQTT连接正常');
                    // 重新启动心跳检测
                    startHeartbeat();
                }
            });

        } catch (error) {
            console.error('MQTT连接创建失败:', error);
            that.setData({
                'mqttStatus.connected': false,
                'mqttStatus.connecting': false
            });
        }
    },

    handleSensorData(data) {
        console.log('处理传感器数据:', data);
        const { devices } = this.data;
        
        try {
            // 更新温度数据
            if (data.temp !== undefined) {
                const tempDevice = devices.find(d => d.type === 'temperature');
                if (tempDevice) {
                    // 将温度值格式化为一位小数，先转换为数字再格式化
                    const tempValue = parseFloat(data.temp);
                    console.log('更新温度数据:', tempValue);
                    this.updateDeviceData(tempDevice.id, tempValue);
                }
            }
            
            // 更新湿度数据
            if (data.humi !== undefined) {
                const humiDevice = devices.find(d => d.type === 'humidity');
                if (humiDevice) {
                    // 湿度值取整数
                    const humiValue = Math.round(parseFloat(data.humi));
                    console.log('更新湿度数据:', humiValue);
                    this.updateDeviceData(humiDevice.id, humiValue);
                }
            }
        } catch (error) {
            console.error('处理传感器数据失败:', error);
        }
    },

    // 更新设备数据
    updateDeviceData(deviceId, value, quality = null) {
        const timestamp = new Date().getTime();
        const { deviceData, historyData, selectedDevice } = this.data;
        const device = this.data.devices.find(d => d.id === deviceId);

        // 根据设备类型格式化值
        const formattedValue = device.type === 'temperature' || device.type === 'fengsu' ? 
            parseFloat(value).toFixed(1) : 
            Math.round(value);

        // 更新当前数据
        deviceData[deviceId] = {
            value: parseFloat(formattedValue),
            timestamp
        };

        // 根据设备类型存储不同的状态值
        if (device.type === 'waterquality') {
            deviceData[deviceId].quality = quality;
        } else if (device.type === 'fengsu') {
            deviceData[deviceId].FDJ = quality;
        }

        // 更新历史数据
        if (!historyData[deviceId]) {
            historyData[deviceId] = [];
        }
        historyData[deviceId].push({
            value: parseFloat(formattedValue),
            timestamp,
            quality
        });

        // 如果是当前选中的设备，更新显示的值
        if (selectedDevice && selectedDevice.id === deviceId) {
            selectedDevice.currentValue = formattedValue;
            if (quality) {
                if (device.type === 'waterquality') {
                    selectedDevice.quality = quality;
                } else if (device.type === 'fengsu') {
                    selectedDevice.FDJ = quality;
                }
            }
        }

        this.setData({
            deviceData,
            historyData,
            selectedDevice
        });

        // 只有传感器设备才更新图表
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = sensorTypes.includes(device.type);
        
        if (isSensorDevice) {
            this.updateChart();
        }

        // 保存历史数据到本地存储
        wx.setStorageSync('historyData', historyData);
        
        // 保存设备数据到本地存储，确保数据持久化
        wx.setStorageSync('deviceData', deviceData);
    },

    // 发送控制命令
    sendCommand(e) {
        const { deviceId, value } = e.currentTarget.dataset;
        const device = this.data.devices.find(d => d.id === deviceId);
        
        if (device && client && client.connected) {
            const command = {
                target: device.type,
                value: parseInt(value)
            };

            client.publish(device.topics.pub, JSON.stringify(command), { qos: 0 }, (err) => {
                if (!err) {
                    console.log('命令发送成功:', command);
                } else {
                    console.error('命令发送失败:', err);
                }
            });
        } else {
            console.error('MQTT未连接或设备未找到');
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
        }
    },

    // 跳转到设备管理页面
    toDeviceManager() {
        wx.navigateTo({
            url: '/pages/device/device'
        });
    },

    // 跳转到MQTT配置页面
    toMqttConfig() {
        wx.navigateTo({
            url: '/pages/mqtt/mqtt'
        });
    },

    onShow() {
        console.log('页面显示，开始重新加载设备列表');
        
        // 重新加载设备列表，确保与设备管理页面同步
        const devices = wx.getStorageSync('devices') || [];
        const historyData = wx.getStorageSync('historyData') || {};
        const deviceData = wx.getStorageSync('deviceData') || {};
        
        console.log('从本地存储加载的设备列表:', devices);
        console.log('从本地存储加载的设备数据:', deviceData);
        
        // 初始化设备数据，确保开关、LED和电机设备有默认状态
        devices.forEach(device => {
            if (device.type === 'switch' || device.type === 'led' || device.type === 'motor') {
                // 从本地存储加载开关状态，默认为关闭
                const savedState = wx.getStorageSync(`device_state_${device.id}`);
                deviceData[device.id] = savedState !== undefined ? savedState : false;
            }
        });
        
        console.log('初始化后的设备数据:', deviceData);
        
        // 更新设备列表
        this.setData({ 
            devices,
            historyData,
            deviceData
        });
        
        console.log('设备列表更新完成，当前设备数量:', devices.length);
        
        // 检查设备状态，确保删除设备后图表状态正确
        this.checkDeviceStatus();
        
        // 页面显示时重新连接
        if (!client && devices.length > 0) {
            console.log('开始连接MQTT');
            this.connectMqtt();
        }
    },

    // 新增：检查设备状态并更新图表显示
    checkDeviceStatus() {
        const { devices, selectedDevice, historyData, deviceData } = this.data;
        
        console.log('检查设备状态:', {
            devicesCount: devices.length,
            devices: devices.map(d => ({ id: d.id, name: d.name, type: d.type })),
            selectedDevice: selectedDevice ? { id: selectedDevice.id, name: selectedDevice.name, type: selectedDevice.type } : null,
            deviceData: deviceData
        });
        
        // 如果没有设备，隐藏图表
        if (devices.length === 0) {
            console.log('没有设备，隐藏图表');
            this.setData({
                selectedDevice: null,
                showChart: false
            });
            return;
        }
        
        // 如果当前选中的设备不存在于设备列表中，选择第一个设备
        if (selectedDevice && !devices.find(d => d.id === selectedDevice.id)) {
            console.log('当前选中的设备不存在，选择第一个设备');
            console.log('当前选中设备ID:', selectedDevice.id);
            console.log('可用设备ID列表:', devices.map(d => d.id));
            
            const firstDevice = devices[0];
            
            // 判断设备类型，决定是否显示折线图
            const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
            const isSensorDevice = sensorTypes.includes(firstDevice.type);
            const shouldShowChart = isSensorDevice;
            
            // 如果是传感器设备，获取当前值
            if (isSensorDevice) {
                // 优先从deviceData获取最近的数据
                const currentDeviceData = deviceData[firstDevice.id];
                if (currentDeviceData && currentDeviceData.value !== undefined) {
                    firstDevice.currentValue = currentDeviceData.value.toFixed(1);
                    console.log('从deviceData恢复设备数据:', firstDevice.currentValue);
                } else {
                    // 如果没有deviceData，尝试从historyData获取
                    const currentData = historyData[firstDevice.id] || {};
                    if (currentData.value) {
                        firstDevice.currentValue = currentData.value.toFixed(1);
                        console.log('从historyData恢复设备数据:', firstDevice.currentValue);
                    } else {
                        firstDevice.currentValue = '--';
                        console.log('设备无数据，设置为默认值');
                    }
                }
                
                // 恢复质量信息
                if (currentDeviceData) {
                    if (firstDevice.type === 'waterquality' && currentDeviceData.quality) {
                        firstDevice.quality = currentDeviceData.quality;
                        console.log('恢复水质传感器质量:', firstDevice.quality);
                    } else if (firstDevice.type === 'fengsu' && currentDeviceData.FDJ) {
                        firstDevice.FDJ = currentDeviceData.FDJ;
                        console.log('恢复风速传感器风等级:', firstDevice.FDJ);
                    }
                }
            } else {
                // 对于灯带和开关设备，设置默认值
                firstDevice.currentValue = '--';
            }
            
            console.log('选择新设备:', {
                device: { id: firstDevice.id, name: firstDevice.name, type: firstDevice.type },
                isSensorDevice,
                shouldShowChart
            });
            
            this.setData({
                selectedDevice: firstDevice,
                showChart: shouldShowChart
            });
            
            // 如果是传感器设备，更新图表
            if (shouldShowChart) {
                setTimeout(() => {
                    this.updateChart();
                }, 100);
            }
        } else if (selectedDevice) {
            console.log('当前选中的设备存在，无需切换');
            // 确保当前选中设备的数据是最新的
            const currentDeviceData = deviceData[selectedDevice.id];
            if (currentDeviceData && currentDeviceData.value !== undefined) {
                selectedDevice.currentValue = currentDeviceData.value.toFixed(1);
                console.log('更新当前选中设备的数据:', selectedDevice.currentValue);
                
                // 恢复质量信息
                if (selectedDevice.type === 'waterquality' && currentDeviceData.quality) {
                    selectedDevice.quality = currentDeviceData.quality;
                } else if (selectedDevice.type === 'fengsu' && currentDeviceData.FDJ) {
                    selectedDevice.FDJ = currentDeviceData.FDJ;
                }
                
                this.setData({ selectedDevice });
            }
        } else {
            console.log('没有选中的设备，选择第一个设备');
            const firstDevice = devices[0];
            
            // 判断设备类型，决定是否显示折线图
            const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
            const isSensorDevice = sensorTypes.includes(firstDevice.type);
            const shouldShowChart = isSensorDevice;
            
            // 如果是传感器设备，获取当前值
            if (isSensorDevice) {
                // 优先从deviceData获取最近的数据
                const currentDeviceData = deviceData[firstDevice.id];
                if (currentDeviceData && currentDeviceData.value !== undefined) {
                    firstDevice.currentValue = currentDeviceData.value.toFixed(1);
                    console.log('从deviceData恢复设备数据:', firstDevice.currentValue);
                } else {
                    // 如果没有deviceData，尝试从historyData获取
                    const currentData = historyData[firstDevice.id] || {};
                    if (currentData.value) {
                        firstDevice.currentValue = currentData.value.toFixed(1);
                        console.log('从historyData恢复设备数据:', firstDevice.currentValue);
                    } else {
                        firstDevice.currentValue = '--';
                        console.log('设备无数据，设置为默认值');
                    }
                }
                
                // 恢复质量信息
                if (currentDeviceData) {
                    if (firstDevice.type === 'waterquality' && currentDeviceData.quality) {
                        firstDevice.quality = currentDeviceData.quality;
                        console.log('恢复水质传感器质量:', firstDevice.quality);
                    } else if (firstDevice.type === 'fengsu' && currentDeviceData.FDJ) {
                        firstDevice.FDJ = currentDeviceData.FDJ;
                        console.log('恢复风速传感器风等级:', firstDevice.FDJ);
                    }
                }
            } else {
                // 对于灯带和开关设备，设置默认值
                firstDevice.currentValue = '--';
            }
            
            console.log('选择第一个设备:', {
                device: { id: firstDevice.id, name: firstDevice.name, type: firstDevice.type },
                isSensorDevice,
                shouldShowChart
            });
            
            this.setData({
                selectedDevice: firstDevice,
                showChart: shouldShowChart
            });
            
            // 如果是传感器设备，更新图表
            if (shouldShowChart) {
                setTimeout(() => {
                    this.updateChart();
                }, 100);
            }
        }
        
        // 清理已删除设备的历史数据
        const deviceIds = devices.map(d => d.id);
        const historyDataKeys = Object.keys(historyData);
        let hasChanges = false;
        
        historyDataKeys.forEach(key => {
            if (!deviceIds.includes(key)) {
                delete historyData[key];
                hasChanges = true;
                console.log('清理已删除设备的历史数据:', key);
            }
        });
        
        if (hasChanges) {
            this.setData({ historyData });
            wx.setStorageSync('historyData', historyData);
        }
    },

    onHide() {
        // 页面隐藏时保存历史数据
        wx.setStorageSync('historyData', this.data.historyData);
        
        // 断开MQTT连接
        if (client) {
            client.end(true);
            client = null;
        }
    },

    onUnload() {
        // 页面卸载时保存历史数据
        wx.setStorageSync('historyData', this.data.historyData);
        
        // 断开MQTT连接
        if (client) {
            client.end(true);
            client = null;
        }
    },

    onShareAppMessage() {
        return {
            title: '智慧物联网监控',
            path: '/pages/index/index'
        };
    },

    // 更新图表数据
    updateChart() {
        const { selectedDevice, historyData, timeRange } = this.data;
        if (!selectedDevice) {
            console.log('没有选中的设备，跳过图表更新');
            return;
        }

        // 检查选中的设备是否为传感器设备
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = sensorTypes.includes(selectedDevice.type);
        if (!isSensorDevice) {
            console.log('选中的设备不是传感器设备，跳过图表更新');
            return;
        }

        console.log('开始更新图表，设备类型:', selectedDevice.type, '设备ID:', selectedDevice.id);

        // 获取图表数据
        const deviceHistory = historyData[selectedDevice.id] || [];
        const now = new Date().getTime();
        const timeLimit = timeRange === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const filteredData = deviceHistory.filter(item => item.timestamp > now - timeLimit);

        console.log('设备历史数据数量:', deviceHistory.length, '过滤后数据数量:', filteredData.length);

        // 获取canvas上下文
        const query = wx.createSelectorQuery();
        query.select('#lineChart')
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res || !res[0] || !res[0].node) {
                    console.warn('无法获取canvas节点，可能图表未显示或DOM未更新');
                    return;
                }
                
                console.log('Canvas节点获取成功');
                
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                
                // 设置canvas大小 - 使用更安全的方式获取像素比
                let dpr = 1;
                try {
                    const systemInfo = wx.getSystemInfoSync();
                    dpr = systemInfo.pixelRatio || 1;
                    console.log('获取到像素比:', dpr);
                } catch (error) {
                    console.warn('获取像素比失败，使用默认值1:', error);
                    dpr = 1;
                }
                
                canvas.width = res[0].width * dpr;
                canvas.height = res[0].height * dpr;
                ctx.scale(dpr, dpr);
                
                console.log('Canvas尺寸设置完成，宽度:', canvas.width, '高度:', canvas.height);
                
                // 清除旧图表
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (filteredData.length === 0) {
                    console.log('没有数据可显示');
                    // 绘制空状态提示
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#999';
                    ctx.fillText('暂无数据', canvas.width / dpr / 2, canvas.height / dpr / 2);
                    return;
                }

                // 准备图表数据
                const labels = filteredData.map(item => formatTime(item.timestamp, timeRange === 'day' ? 'time' : 'date'));
                const values = filteredData.map(item => item.value);
                
                console.log('图表数据准备完成，标签数量:', labels.length, '数值数量:', values.length);
                
                // 绘制新图表
                try {
                    this.drawChart(ctx, canvas.width / dpr, canvas.height / dpr, labels, values);
                    console.log('图表绘制完成');
                } catch (error) {
                    console.error('绘制图表失败:', error);
                }
            });
    },

    // 新增：处理点击开关文字的方法
    onSwitchTextClick(e) {
        const { id } = e.currentTarget.dataset;
        console.log('点击开关文字，设备ID:', id);
        
        const device = this.data.devices.find(d => d.id === id);
        if (!device || (device.type !== 'switch' && device.type !== 'led')) {
            console.error('设备类型不支持:', device);
            return;
        }

        // 播放音效
        this.playSoundEffect();

        const currentState = this.data.deviceData[id];
        const newState = !currentState;
        
        console.log('开关状态切换:', { currentState, newState, device });
        
        // 发送MQTT消息
        if (client && client.connected) {
            const command = newState ? device.onCommand : device.offCommand;
            console.log('发送MQTT命令:', command);
            
            client.publish(device.publishTopic, command, { qos: 0 }, (err) => {
                if (err) {
                    console.error('MQTT发送失败:', err);
                    wx.showToast({
                        title: '发送失败',
                        icon: 'none'
                    });
                } else {
                    console.log('MQTT发送成功，更新状态');
                    // 更新状态
                    this.setData({
                        [`deviceData.${id}`]: newState
                    });
                    
                    // 保存状态到本地存储
                    wx.setStorageSync(`device_state_${id}`, newState);
                    
                    // 显示状态变化提示
                    wx.showToast({
                        title: newState ? '已开启' : '已关闭',
                        icon: 'success',
                        duration: 1000
                    });
                }
            });
        } else {
            console.error('MQTT未连接');
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
        }
    },

    drawChart(ctx, width, height, labels, values) {
        const padding = { 
            left: 50,
            right: 20, 
            top: 20, 
            bottom: 30 
        };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // 计算数据范围
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const valueRange = maxValue - minValue || 1;

        // 定义步进数
        const steps = 5;
        const timeSteps = Math.min(values.length, 6);

        // 绘制Y轴
        ctx.beginPath();
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.stroke();

        // 绘制平滑曲线和渐变填充
        if (values.length > 0) {
            // 创建渐变
            const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            gradient.addColorStop(0, 'rgba(24, 144, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(24, 144, 255, 0)');

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#1890ff';
            ctx.fillStyle = gradient;

            // 绘制平滑曲线
            ctx.moveTo(padding.left, height - padding.bottom - ((values[0] - minValue) / valueRange) * chartHeight);

            for (let i = 0; i < values.length - 1; i++) {
                const currentX = padding.left + (i / (values.length - 1)) * chartWidth;
                const nextX = padding.left + ((i + 1) / (values.length - 1)) * chartWidth;
                
                const currentY = height - padding.bottom - ((values[i] - minValue) / valueRange) * chartHeight;
                const nextY = height - padding.bottom - ((values[i + 1] - minValue) / valueRange) * chartHeight;
                
                // 控制点
                const cp1x = currentX + (nextX - currentX) / 2;
                const cp1y = currentY;
                const cp2x = currentX + (nextX - currentX) / 2;
                const cp2y = nextY;
                
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);
            }

            // 完成面积图的路径
            const lastX = width - padding.right;
            const lastY = height - padding.bottom - ((values[values.length - 1] - minValue) / valueRange) * chartHeight;
            
            ctx.lineTo(lastX, height - padding.bottom);
            ctx.lineTo(padding.left, height - padding.bottom);
            ctx.closePath();
            
            // 填充渐变色
            ctx.fill();
            
            // 重新绘制线条
            ctx.beginPath();
            ctx.moveTo(padding.left, height - padding.bottom - ((values[0] - minValue) / valueRange) * chartHeight);
            
            for (let i = 0; i < values.length - 1; i++) {
                const currentX = padding.left + (i / (values.length - 1)) * chartWidth;
                const nextX = padding.left + ((i + 1) / (values.length - 1)) * chartWidth;
                
                const currentY = height - padding.bottom - ((values[i] - minValue) / valueRange) * chartHeight;
                const nextY = height - padding.bottom - ((values[i + 1] - minValue) / valueRange) * chartHeight;
                
                const cp1x = currentX + (nextX - currentX) / 2;
                const cp1y = currentY;
                const cp2x = currentX + (nextX - currentX) / 2;
                const cp2y = nextY;
                
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);
            }
            ctx.stroke();

            // 绘制数据点
            values.forEach((value, index) => {
                const x = padding.left + (index / (values.length - 1)) * chartWidth;
                const y = height - padding.bottom - ((value - minValue) / valueRange) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#1890ff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // 绘制Y轴刻度
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#666';

        for (let i = 0; i <= steps; i++) {
            const value = minValue + (valueRange * i) / steps;
            const y = height - padding.bottom - (i / steps) * chartHeight;
            
            // 根据设备类型确定单位
            let unit = '';
            if (this.data.selectedDevice.type === 'temperature') {
                unit = '°C';
            } else if (this.data.selectedDevice.type === 'humidity') {
                unit = '%';
            } else if (this.data.selectedDevice.type === 'waterquality') {
                unit = 'ppm';
            } else if (this.data.selectedDevice.type === 'turang') {
                unit = '%';
            } else if (this.data.selectedDevice.type === 'fengsu') {
                unit = 'm/s';
            }
            
            ctx.fillText(value.toFixed(1) + unit, padding.left - 8, y);
        }

        // 绘制X轴刻度
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#666';

        for (let i = 0; i < timeSteps; i++) {
            const index = Math.floor((i * (values.length - 1)) / (timeSteps - 1));
            const x = padding.left + (index / (values.length - 1)) * chartWidth;
            ctx.fillText(labels[index], x, height - padding.bottom + 8);
        }
    },

    // LED控制相关方法
    showLedControl(e) {
        const { id } = e.currentTarget.dataset;
        const device = this.data.devices.find(d => d.id === id);
        if (!device) return;

        // 移除播放音效，因为现在只有点击文字时才播放音效

        // 从本地存储加载上次的设置
        const savedSettings = wx.getStorageSync(`led_settings_${device.id}`) || {};
        const defaultBrightness = savedSettings.brightness !== undefined ? savedSettings.brightness : 100;
        const defaultColor = savedSettings.color || { r: 255, g: 255, b: 255 };

        // 确保ledColor的所有属性都存在且为数字类型
        const safeLedColor = {
            r: typeof defaultColor.r === 'number' ? defaultColor.r : 255,
            g: typeof defaultColor.g === 'number' ? defaultColor.g : 255,
            b: typeof defaultColor.b === 'number' ? defaultColor.b : 255
        };

        // 计算颜色字符串
        const colorString = `rgb(${safeLedColor.r}, ${safeLedColor.g}, ${safeLedColor.b})`;

        console.log('加载LED设置:', { 
            deviceId: device.id, 
            savedSettings, 
            defaultBrightness, 
            defaultColor, 
            safeLedColor, 
            colorString 
        });

        this.setData({
            showLedDialog: true,
            currentLedDevice: device,
            ledBrightness: defaultBrightness,
            ledColor: safeLedColor,
            ledColorString: colorString,
            showChart: false // 隐藏折线图
        });

        // 禁止页面滚动
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 0
        });

        // 延迟初始化色盘，确保DOM已更新
        setTimeout(() => {
            this.initColorWheel();
        }, 100);
    },

    closeLedDialog() {
        // 根据当前选中的设备类型决定是否显示图表
        const { selectedDevice } = this.data;
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = selectedDevice ? sensorTypes.includes(selectedDevice.type) : false;
        const shouldShowChart = isSensorDevice;
        
        this.setData({
            showLedDialog: false,
            currentLedDevice: null,
            showChart: shouldShowChart // 根据设备类型决定是否显示折线图
        });
        
        // 恢复页面滚动
        setTimeout(() => {
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 0
            });
        }, 100);
    },

    stopPropagation() {
        // 阻止事件冒泡
    },

    onBrightnessChange(e) {
        this.setData({
            ledBrightness: e.detail.value
        });
    },

    onQuickColorSelect(e) {
        try {
            const { r, g, b } = e.currentTarget.dataset;
            console.log('选择预设颜色，颜色分量:', { r, g, b });
            
            // 确保颜色数据安全，但不要覆盖有效的颜色值
            const safeColor = {
                r: r !== undefined && !isNaN(parseInt(r)) ? parseInt(r) : 255,
                g: g !== undefined && !isNaN(parseInt(g)) ? parseInt(g) : 255,
                b: b !== undefined && !isNaN(parseInt(b)) ? parseInt(b) : 255
            };
            
            // 验证RGB值范围
            safeColor.r = Math.max(0, Math.min(255, safeColor.r));
            safeColor.g = Math.max(0, Math.min(255, safeColor.g));
            safeColor.b = Math.max(0, Math.min(255, safeColor.b));
            
            const colorString = `rgb(${safeColor.r}, ${safeColor.g}, ${safeColor.b})`;
            
            console.log('处理后的颜色:', { original: { r, g, b }, safeColor, colorString });
            
            this.setData({
                ledColor: safeColor,
                ledColorString: colorString
            });
        } catch (error) {
            console.error('预设颜色选择失败:', error);
            // 设置默认白色
            this.setData({
                ledColor: { r: 255, g: 255, b: 255 },
                ledColorString: 'rgb(255, 255, 255)'
            });
        }
    },

    initColorWheel() {
        const that = this;
        wx.createSelectorQuery().select('#colorWheel').fields({
            node: true,
            size: true,
        }).exec((res) => {
            if (!res || !res[0]) {
                console.error('无法获取canvas节点');
                return;
            }
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const width = res[0].width;
            const height = res[0].height;
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制色盘
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 2;
            
            // 使用预定义的颜色数组绘制色盘
            const colors = [
                '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', // 红到黄
                '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', // 黄绿到绿
                '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', // 绿到蓝
                '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', // 蓝到紫
                '#ff00ff', '#ff00bf', '#ff0080', '#ff0040', '#ff0000'  // 紫到红
            ];
            
            // 绘制色盘 - 使用分段绘制
            for (let i = 0; i < colors.length; i++) {
                const angle = (i / colors.length) * 2 * Math.PI;
                const nextAngle = ((i + 1) / colors.length) * 2 * Math.PI;
                
                ctx.fillStyle = colors[i];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, angle, nextAngle);
                ctx.closePath();
                ctx.fill();
            }
            
            // 在中心添加白色圆圈
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            console.log('色盘绘制完成');
        });
    },

    onColorWheelTouch(e) {
        try {
            const touch = e.touches[0];
            if (!touch) {
                console.error('触摸事件数据无效');
                return;
            }

            const query = wx.createSelectorQuery();
            query.select('#colorWheel').boundingClientRect((rect) => {
                if (!rect) {
                    console.error('无法获取色盘元素位置');
                    return;
                }
                
                // 使用更稳定的坐标计算
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const radius = Math.min(rect.width, rect.height) / 2 - 2;
                
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 排除中心白色圆圈区域
                if (distance > 8 && distance <= radius) {
                    // 计算角度，从右侧开始，顺时针方向
                    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    // 将角度转换为0-360度范围，从红色开始
                    angle = (angle + 360) % 360;
                    
                    // 使用预定义的颜色数组来获取颜色
                    const colors = [
                        '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', // 红到黄
                        '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', // 黄绿到绿
                        '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', // 绿到蓝
                        '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', // 蓝到紫
                        '#ff00ff', '#ff00bf', '#ff0080', '#ff0040', '#ff0000'  // 紫到红
                    ];
                    
                    // 根据角度选择颜色，确保索引在有效范围内
                    const colorIndex = Math.floor((angle / 360) * colors.length);
                    const clampedIndex = Math.max(0, Math.min(colorIndex, colors.length - 1));
                    const selectedColor = colors[clampedIndex];
                    
                    console.log('触摸位置:', { x, y, angle, colorIndex, clampedIndex, selectedColor });
                    
                    // 将十六进制颜色转换为RGB
                    const rgb = this.hexToRgb(selectedColor);
                    
                    // 确保RGB数据安全
                    const safeRgb = {
                        r: rgb && typeof rgb.r === 'number' ? rgb.r : 255,
                        g: rgb && typeof rgb.g === 'number' ? rgb.g : 255,
                        b: rgb && typeof rgb.b === 'number' ? rgb.b : 255
                    };
                    
                    const colorString = `rgb(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b})`;
                    
                    console.log('选择的颜色:', { selectedColor, rgb, safeRgb, colorString });
                    
                    this.setData({
                        ledColor: safeRgb,
                        ledColorString: colorString
                    });
                }
            }).exec();
        } catch (error) {
            console.error('色盘触摸事件处理失败:', error);
        }
    },

    // 新增：十六进制颜色转RGB
    hexToRgb(hex) {
        try {
            if (!hex || typeof hex !== 'string') {
                console.warn('无效的十六进制颜色值:', hex);
                return { r: 255, g: 255, b: 255 };
            }
            
            // 确保颜色值格式正确
            const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
            
            if (!result) {
                console.warn('十六进制颜色格式无效:', hex);
                return { r: 255, g: 255, b: 255 };
            }
            
            const rgb = {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            };
            
            // 验证RGB值是否在有效范围内
            if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b) ||
                rgb.r < 0 || rgb.r > 255 ||
                rgb.g < 0 || rgb.g > 255 ||
                rgb.b < 0 || rgb.b > 255) {
                console.warn('RGB值超出范围:', rgb);
                return { r: 255, g: 255, b: 255 };
            }
            
            console.log('颜色转换成功:', { hex, cleanHex, rgb });
            return rgb;
        } catch (error) {
            console.error('颜色转换失败:', error, hex);
            return { r: 255, g: 255, b: 255 };
        }
    },

    // 新增：HSL转RGB
    hslToRgb(h, s, l) {
        h /= 360; // 将角度转换为0-1范围
        s /= 100; // 将百分比转换为0-1范围
        l /= 100; // 将百分比转换为0-1范围
        
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // 饱和度为0时，表示灰色
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { 
            r: Math.round(r * 255), 
            g: Math.round(g * 255), 
            b: Math.round(b * 255) 
        };
    },

    applyLedSettings() {
        const { currentLedDevice, ledColor, ledBrightness } = this.data;
        
        if (!currentLedDevice || !client || !client.connected) {
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
            return;
        }
        
        // 验证颜色数据
        const safeColor = {
            r: typeof ledColor.r === 'number' ? Math.max(0, Math.min(255, ledColor.r)) : 255,
            g: typeof ledColor.g === 'number' ? Math.max(0, Math.min(255, ledColor.g)) : 255,
            b: typeof ledColor.b === 'number' ? Math.max(0, Math.min(255, ledColor.b)) : 255
        };
        
        // 验证亮度数据
        const safeBrightness = typeof ledBrightness === 'number' ? 
            Math.max(0, Math.min(100, ledBrightness)) : 100;
        
        // 保存设置到本地存储
        const settingsToSave = {
            brightness: safeBrightness,
            color: safeColor
        };
        
        wx.setStorageSync(`led_settings_${currentLedDevice.id}`, settingsToSave);
        
        console.log('保存LED设置:', {
            deviceId: currentLedDevice.id,
            originalColor: ledColor,
            safeColor,
            originalBrightness: ledBrightness,
            safeBrightness,
            settingsToSave
        });
        
        // 发送颜色控制命令
        const colorCommand = JSON.stringify({
            color: {
                r: safeColor.r,
                g: safeColor.g,
                b: safeColor.b
            }
        });
        
        // 发送亮度控制命令
        const brightnessValue = Math.round((safeBrightness / 100) * 255);
        const brightnessCommand = JSON.stringify({
            brightness: brightnessValue
        });
        
        console.log('发送MQTT命令:', {
            colorCommand,
            brightnessCommand,
            brightnessValue
        });
        
        // 发送命令
        client.publish(currentLedDevice.publishTopic, colorCommand, { qos: 0 }, (err) => {
            if (err) {
                console.error('颜色命令发送失败:', err);
                wx.showToast({
                    title: '颜色设置失败',
                    icon: 'none'
                });
            } else {
                console.log('颜色命令发送成功');
                setTimeout(() => {
                    client.publish(currentLedDevice.publishTopic, brightnessCommand, { qos: 0 }, (err2) => {
                        if (err2) {
                            console.error('亮度命令发送失败:', err2);
                            wx.showToast({
                                title: '亮度设置失败',
                                icon: 'none'
                            });
                        } else {
                            console.log('亮度命令发送成功');
                            wx.showToast({
                                title: '设置成功',
                                icon: 'success'
                            });
                            this.closeLedDialog();
                        }
                    });
                }, 100);
            }
        });
    },

    // 新增：播放音效
    playSoundEffect() {
        try {
            const audioContext = wx.createInnerAudioContext();
            audioContext.src = '/images/kj.mp3';
            audioContext.volume = 0.5; // 设置音量为50%
            audioContext.play();
            
            // 播放完成后释放资源
            audioContext.onEnded(() => {
                audioContext.destroy();
            });
            
            // 播放错误处理
            audioContext.onError((err) => {
                console.error('音频播放失败:', err);
                audioContext.destroy();
            });
            
            console.log('播放音效成功');
        } catch (error) {
            console.error('创建音频上下文失败:', error);
        }
    },

    // 电机控制相关方法
    // 电机开启/关闭切换
    onMotorToggle(e) {
        const { id } = e.currentTarget.dataset;
        console.log('电机切换，设备ID:', id);
        console.log('当前设备列表:', this.data.devices.map(d => ({ id: d.id, name: d.name, type: d.type })));
        
        const device = this.data.devices.find(d => d.id === id);
        if (!device) {
            console.error('未找到电机设备:', id);
            wx.showToast({
                title: '设备未找到',
                icon: 'none'
            });
            return;
        }

        console.log('找到电机设备:', device);

        // 播放音效
        this.playSoundEffect();

        // 获取当前状态
        const currentState = this.data.deviceData[id];
        const newState = !currentState;

        console.log('电机状态切换:', { currentState, newState, device });

        // 发送MQTT消息
        if (client && client.connected) {
            if (newState) {
                // 开启电机（默认正转）
                this.sendMotorCommand(device, 'forward', 0);
            } else {
                // 关闭电机
                this.sendMotorStopCommand(device);
            }
            
            // 更新状态
            this.setData({
                [`deviceData.${id}`]: newState
            });
            
            // 保存状态到本地存储
            wx.setStorageSync(`device_state_${id}`, newState);
            
            // 显示状态变化提示
            wx.showToast({
                title: newState ? '电机已开启' : '电机已关闭',
                icon: 'success',
                duration: 1000
            });
        } else {
            console.error('MQTT未连接');
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
        }
    },

    // 显示电机控制弹窗
    showMotorControl(e) {
        const { id } = e.currentTarget.dataset;
        console.log('显示电机控制弹窗，设备ID:', id);
        console.log('当前设备列表:', this.data.devices.map(d => ({ id: d.id, name: d.name, type: d.type })));
        
        const device = this.data.devices.find(d => d.id === id);
        if (!device) {
            console.error('未找到电机设备:', id);
            wx.showToast({
                title: '设备未找到',
                icon: 'none'
            });
            return;
        }

        console.log('找到电机设备:', device);

        this.setData({
            showMotorDialog: true,
            currentMotorDevice: device,
            showChart: false // 隐藏折线图
        });

        // 禁止页面滚动
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 0
        });
    },

    // 关闭电机控制弹窗
    closeMotorDialog() {
        // 根据当前选中的设备类型决定是否显示图表
        const { selectedDevice } = this.data;
        const sensorTypes = ['temperature', 'humidity', 'waterquality', 'turang', 'fengsu'];
        const isSensorDevice = selectedDevice ? sensorTypes.includes(selectedDevice.type) : false;
        const shouldShowChart = isSensorDevice;
        
        this.setData({
            showMotorDialog: false,
            currentMotorDevice: null,
            showChart: shouldShowChart // 根据设备类型决定是否显示折线图
        });
        
        // 恢复页面滚动
        setTimeout(() => {
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 0
            });
        }, 100);
    },

    // 电机快捷控制
    onMotorQuickControl(e) {
        const { action, duration } = e.currentTarget.dataset;
        const { currentMotorDevice } = this.data;
        
        if (!currentMotorDevice) return;

        // 播放音效
        this.playSoundEffect();

        // 发送命令
        this.sendMotorCommand(currentMotorDevice, action, parseInt(duration));
    },

    // 电机方向选择
    onMotorDirectionChange(e) {
        const index = e.detail.value;
        const direction = this.data.motorDirections[index].value;
        this.setData({
            motorDirectionIndex: index,
            motorDirection: direction
        });
    },

    // 电机运行时间调整
    onMotorDurationChange(e) {
        const { action } = e.currentTarget.dataset;
        let { motorDuration } = this.data;
        
        if (action === 'plus') {
            motorDuration = Math.min(motorDuration + 1, 60); // 最大60秒
        } else if (action === 'minus') {
            motorDuration = Math.max(motorDuration - 1, 1); // 最小1秒
        }
        
        this.setData({ motorDuration });
    },

    // 启动电机
    onMotorStart() {
        const { currentMotorDevice, motorDirection, motorDuration } = this.data;
        
        if (!currentMotorDevice) return;

        // 播放音效
        this.playSoundEffect();

        // 发送命令
        this.sendMotorCommand(currentMotorDevice, motorDirection, motorDuration);
    },

    // 停止电机
    onMotorStop() {
        const { currentMotorDevice } = this.data;
        
        if (!currentMotorDevice) return;

        // 播放音效
        this.playSoundEffect();

        // 发送停止命令
        this.sendMotorStopCommand(currentMotorDevice);
    },

    // 发送电机控制命令
    sendMotorCommand(device, direction, duration) {
        if (!client || !client.connected) {
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
            return;
        }

        const command = {
            on: direction === 'forward' ? '1' : '0',
            duration: duration
        };

        console.log('发送电机命令:', command);

        client.publish(device.publishTopic, JSON.stringify(command), { qos: 0 }, (err) => {
            if (err) {
                console.error('电机命令发送失败:', err);
                wx.showToast({
                    title: '发送失败',
                    icon: 'none'
                });
            } else {
                console.log('电机命令发送成功');
                wx.showToast({
                    title: '命令已发送',
                    icon: 'success',
                    duration: 1000
                });
            }
        });
    },

    // 发送电机停止命令
    sendMotorStopCommand(device) {
        if (!client || !client.connected) {
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none'
            });
            return;
        }

        const command = {
            off: true
        };

        console.log('发送电机停止命令:', command);

        client.publish(device.publishTopic, JSON.stringify(command), { qos: 0 }, (err) => {
            if (err) {
                console.error('电机停止命令发送失败:', err);
                wx.showToast({
                    title: '发送失败',
                    icon: 'none'
                });
            } else {
                console.log('电机停止命令发送成功');
                wx.showToast({
                    title: '电机已停止',
                    icon: 'success',
                    duration: 1000
                });
            }
        });
    }
});