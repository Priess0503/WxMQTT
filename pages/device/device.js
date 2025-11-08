const api = require('../../utils/api');

Page({
  data: {
    devices: [],
    showAddDialog: false,
    showEditDialog: false,
    wxId: null,
    mqttConfig: {
      host: '',
      port: '',
      username: '',
      password: ''
    },
    newDevice: {
      name: '',
      type: 'temperature',
      topic: '',
      showChart: true,
      publishTopic: '',
      onCommand: '',
      offCommand: ''
    },
    editDevice: {
      id: '',
      name: '',
      type: '',
      topic: '',
      showChart: true,
      publishTopic: '',
      onCommand: '',
      offCommand: ''
    },
    deviceTypes: [
      { text: '温度', value: 'temperature', icon: 'temp' },
      { text: '湿度', value: 'humidity', icon: 'water' },
      { text: '开关', value: 'switch', icon: 'switch' },
      { text: '水质', value: 'waterquality', icon: 'shuizhi' },
      { text: '水质', value: 'turang', icon: 'tr' },
      { text: '水质', value: 'fengsu', icon: 'fs' },
      { text: '电机', value: 'motor', icon: 'dianji' }
    ],
    currentDeviceType: null
  },

  onLoad() {
    // 获取微信ID
    const app = getApp();
    const wxId = app.getWxId();
    
    // 从本地存储加载设备配置和MQTT配置
    const devices = wx.getStorageSync('devices') || [];
    const mqttConfig = wx.getStorageSync('mqttConfig') || {
      host: '',
      port: '',
      username: '',
      password: ''
    };
    this.setData({ 
      wxId,
      devices,
      mqttConfig,
      currentDeviceType: this.data.deviceTypes[0]
    });
  },

  showMqttDialog() {
    this.setData({ showMqttDialog: true });
  },

  closeMqttDialog() {
    this.setData({ showMqttDialog: false });
  },

  onMqttConfigInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`mqttConfig.${field}`]: value
    });
  },

  saveMqttConfig() {
    const { mqttConfig } = this.data;
    if (!mqttConfig.host) {
      wx.showToast({
        title: '请输入服务器地址',
        icon: 'none'
      });
      return;
    }

    wx.setStorageSync('mqttConfig', mqttConfig);
    this.setData({ showMqttDialog: false });
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  showAddDeviceDialog() {
    this.setData({ 
      showAddDialog: true,
      newDevice: {
        name: '',
        type: 'temperature',
        topic: '',
        showChart: true,
        publishTopic: '',
        onCommand: '',
        offCommand: ''
      },
      currentDeviceType: this.data.deviceTypes[0]
    });
  },

  closeAddDeviceDialog() {
    this.setData({ showAddDialog: false });
  },

  onDeviceNameInput(e) {
    this.setData({
      'newDevice.name': e.detail.value
    });
  },

  onDeviceTypeChange(e) {
    const type = e.detail.value;
    const currentDeviceType = this.data.deviceTypes.find(t => t.value === type);
    this.setData({
      'newDevice.type': type,
      currentDeviceType
    });
  },

  onTopicInput(e) {
    this.setData({
      'newDevice.topic': e.detail.value
    });
  },

  onDeviceTypeSelect(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'newDevice.type': type,
      currentDeviceType: this.data.deviceTypes.find(t => t.value === type)
    });
  },

  onPublishTopicInput(e) {
    this.setData({
      'newDevice.publishTopic': e.detail.value
    });
  },

  onCommandInput(e) {
    const commandType = e.currentTarget.dataset.commandType;
    this.setData({
      [`newDevice.${commandType}Command`]: e.detail.value
    });
  },

  async addDevice() {
    const { devices, newDevice, wxId } = this.data;
    
    // 验证设备信息
    if (!newDevice.name) {
      wx.showToast({
        title: '请填写设备名称',
        icon: 'none'
      });
      return;
    }

    if (newDevice.type === 'switch' || newDevice.type === 'led') {
      // 验证开关和LED类型的必填字段
      if (!newDevice.publishTopic) {
        wx.showToast({
          title: '请填写发布主题',
          icon: 'none'
        });
        return;
      }
      if (!newDevice.onCommand) {
        wx.showToast({
          title: '请填写开启命令',
          icon: 'none'
        });
        return;
      }
      if (!newDevice.offCommand) {
        wx.showToast({
          title: '请填写关闭命令',
          icon: 'none'
        });
        return;
      }
    } else if (newDevice.type === 'motor') {
      // 验证电机类型的必填字段
      if (!newDevice.publishTopic) {
        wx.showToast({
          title: '请填写发布主题',
          icon: 'none'
        });
        return;
      }
    } else {
      // 验证其他类型的必填字段
      if (!newDevice.topic) {
        wx.showToast({
          title: '请填写订阅主题',
          icon: 'none'
        });
        return;
      }

      // 检查相同类型的设备是否已经使用了该主题
      const topicExists = devices.some(device => 
        device.topic === newDevice.topic && device.type === newDevice.type
      );
      
      if (topicExists) {
        wx.showToast({
          title: '该主题已被相同类型的设备使用',
          icon: 'none'
        });
        return;
      }
    }

    const newDeviceData = {
      id: Date.now().toString(),
      name: newDevice.name,
      type: newDevice.type,
      showChart: true
    };

    // 根据设备类型添加不同的属性
    if (newDevice.type === 'switch' || newDevice.type === 'led') {
      newDeviceData.publishTopic = newDevice.publishTopic;
      newDeviceData.onCommand = newDevice.onCommand;
      newDeviceData.offCommand = newDevice.offCommand;
    } else if (newDevice.type === 'motor') {
      newDeviceData.publishTopic = newDevice.publishTopic;
    } else {
      newDeviceData.topic = newDevice.topic;
    }

    const updatedDevices = [...devices, newDeviceData];

    // 显示加载提示
    wx.showLoading({
      title: '添加中...',
      mask: true
    });

    try {
      // 1. 保存到本地存储
      wx.setStorageSync('devices', updatedDevices);
      
      // 2. 同步到数据库
      if (wxId) {
        const result = await api.addDevice(wxId, newDeviceData);
        
        if (result.success) {
          console.log('设备已同步到数据库');
        } else {
          console.error('同步设备失败:', result.error);
        }
      }
      
      wx.hideLoading();
      
      this.setData({
        devices: updatedDevices,
        showAddDialog: false,
        newDevice: {
          name: '',
          type: 'temperature',
          topic: '',
          showChart: true,
          publishTopic: '',
          onCommand: '',
          offCommand: ''
        }
      });

      // 通知首页刷新设备列表
      const pages = getCurrentPages();
      const indexPage = pages.find(p => p.route === 'pages/index/index');
      if (indexPage) {
        indexPage.setData({ devices: updatedDevices });
        // 重新连接MQTT以订阅新设备的主题
        indexPage.connectMqtt();
      }

      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('添加设备失败:', error);
      
      wx.showToast({
        title: '添加成功(已保存到本地)',
        icon: 'success'
      });
    }
  },

  toggleChart(e) {
    const { id } = e.currentTarget.dataset;
    const devices = this.data.devices.map(device => {
      if (device.id === id) {
        return { ...device, showChart: !device.showChart };
      }
      return device;
    });
    
    this.setData({ devices });
    wx.setStorageSync('devices', devices);
  },

  async deleteDevice(e) {
    const { id } = e.currentTarget.dataset;
    const { wxId } = this.data;
    const updatedDevices = this.data.devices.filter(device => device.id !== id);
    
    // 显示加载提示
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    try {
      // 1. 保存到本地存储
      wx.setStorageSync('devices', updatedDevices);
      
      // 2. 从数据库删除
      if (wxId) {
        const result = await api.deleteDevice(wxId, id);
        
        if (result.success) {
          console.log('设备已从数据库删除');
        } else {
          console.error('从数据库删除设备失败:', result.error);
        }
      }
      
      wx.hideLoading();
      
      this.setData({ devices: updatedDevices });

      // 通知首页刷新设备列表
      const pages = getCurrentPages();
      const indexPage = pages.find(p => p.route === 'pages/index/index');
      if (indexPage) {
        indexPage.setData({ devices: updatedDevices });
        // 重新连接MQTT以更新订阅
        indexPage.connectMqtt();
      }

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('删除设备失败:', error);
      
      wx.showToast({
        title: '删除成功(已从本地删除)',
        icon: 'success'
      });
    }
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  // 显示编辑设备弹窗
  showEditDeviceDialog(e) {
    const { id } = e.currentTarget.dataset;
    const device = this.data.devices.find(d => d.id === id);
    if (!device) return;

    this.setData({
      showEditDialog: true,
      editDevice: { ...device }
    });
  },

  // 关闭编辑设备弹窗
  closeEditDeviceDialog() {
    this.setData({ showEditDialog: false });
  },

  // 编辑设备名称输入
  onEditDeviceNameInput(e) {
    this.setData({
      'editDevice.name': e.detail.value
    });
  },

  // 编辑订阅主题输入
  onEditTopicInput(e) {
    this.setData({
      'editDevice.topic': e.detail.value
    });
  },

  // 编辑发布主题输入
  onEditPublishTopicInput(e) {
    this.setData({
      'editDevice.publishTopic': e.detail.value
    });
  },

  // 编辑开关命令输入
  onEditCommandInput(e) {
    const commandType = e.currentTarget.dataset.commandType;
    this.setData({
      [`editDevice.${commandType}Command`]: e.detail.value
    });
  },

  // 更新设备
  async updateDevice() {
    const { devices, editDevice, wxId } = this.data;
    
    // 验证设备信息
    if (!editDevice.name) {
      wx.showToast({
        title: '请填写设备名称',
        icon: 'none'
      });
      return;
    }

    if (editDevice.type === 'switch' || editDevice.type === 'led') {
      // 验证开关和LED类型的必填字段
      if (!editDevice.publishTopic) {
        wx.showToast({
          title: '请填写发布主题',
          icon: 'none'
        });
        return;
      }
      if (!editDevice.onCommand) {
        wx.showToast({
          title: '请填写开启命令',
          icon: 'none'
        });
        return;
      }
      if (!editDevice.offCommand) {
        wx.showToast({
          title: '请填写关闭命令',
          icon: 'none'
        });
        return;
      }
    } else if (editDevice.type === 'motor') {
      // 验证电机类型的必填字段
      if (!editDevice.publishTopic) {
        wx.showToast({
          title: '请填写发布主题',
          icon: 'none'
        });
        return;
      }
    } else {
      // 验证其他类型的必填字段
      if (!editDevice.topic) {
        wx.showToast({
          title: '请填写订阅主题',
          icon: 'none'
        });
        return;
      }

      // 检查相同类型的设备是否已经使用了该主题（排除当前设备）
      const topicExists = devices.some(device => 
        device.id !== editDevice.id && 
        device.topic === editDevice.topic && 
        device.type === editDevice.type
      );
      
      if (topicExists) {
        wx.showToast({
          title: '该主题已被相同类型的设备使用',
          icon: 'none'
        });
        return;
      }
    }

    // 更新设备列表
    const updatedDevices = devices.map(device => 
      device.id === editDevice.id ? editDevice : device
    );

    // 显示加载提示
    wx.showLoading({
      title: '更新中...',
      mask: true
    });

    try {
      // 1. 保存到本地存储
      wx.setStorageSync('devices', updatedDevices);
      
      // 2. 同步到数据库
      if (wxId) {
        const result = await api.updateDevice(wxId, editDevice);
        
        if (result.success) {
          console.log('设备已同步到数据库');
        } else {
          console.error('同步设备失败:', result.error);
        }
      }
      
      wx.hideLoading();
      
      this.setData({
        devices: updatedDevices,
        showEditDialog: false
      });

      // 通知首页刷新设备列表
      const pages = getCurrentPages();
      const indexPage = pages.find(p => p.route === 'pages/index/index');
      if (indexPage) {
        indexPage.setData({ devices: updatedDevices });
        // 重新连接MQTT以更新订阅
        indexPage.connectMqtt();
      }

      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('更新设备失败:', error);
      
      wx.showToast({
        title: '更新成功(已保存到本地)',
        icon: 'success'
      });
    }
  }
}) 