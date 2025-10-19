// pages/view/view.js
var mqtt = require('../../utils/mqtt.min.js') // 引入MQTT库
var client = null // 初始化MQTT客户端为null

Page({
  /**
   * 页面的初始数据
   */
  data: {
    connectionInfo: {}, // 存储连接信息
    temp:'0',//温度
    humi:'0',//湿度
    moisture:'0',//土壤湿度
    //ledchecked:false,//led控制
    ledchecked:false,//led控制
    beepchecked:false,//beep控制
    beepchecked1:false,//大棚控制
    isConnected: false,  // 初始状态为未连接
  },

  /**
   * 切换连接状态的函数
   */
  toggleConnection() {
    if (this.data.isConnected) {
      // 当前是连接状态，需要断开
      this.disconnectMqtt(); // 调用断开连接函数
    } else {
      // 当前是断开状态，需要重新连接
      this.reconnectMqtt(); // 调用重新连接函数
    }
  },

  /**
   * 断开MQTT连接的函数
   */
  disconnectMqtt() {
    if (this.client) {
      // 如果客户端存在，调用end方法断开连接
      this.client.end(); 
      this.setData({
        isConnected: false // 更新连接状态为未连接
      });
      wx.showToast({
        title: '已断开连接', // 提示用户已断开连接
        icon: 'none',
        duration: 1500 // 提示持续时间
      });
    }
  },

  /**
   * 重新连接MQTT的函数
   */
  reconnectMqtt() {
    if (this.data.connectionInfo) {
      // 如果连接信息存在，调用连接函数
      this.connectMqtt(this.data.connectionInfo);
    } else {
      // 如果连接信息不存在，提示用户
      wx.showToast({
        title: '连接信息不存在', // 提示用户连接信息缺失
        icon: 'error',
        duration: 1500 // 提示持续时间
      });
    }
  },

  /**
   * MQTT连接函数
   * @param {Object} connectionData - 连接所需的信息
   */
  connectMqtt(connectionData) {
    const { id: clientId, url: host, username, password } = connectionData // 解构连接信息
    const options = {
      connectTimeout: 4000, // 设置连接超时时间
      clientId, // 客户端ID
      port: 8084, // 端口号
      username, // 用户名
      password // 密码
    }

    let reconnectAttempts = 0; // 初始化重连尝试次数
    wx.showLoading({
      title: '连接中...', // 显示加载提示
    });

    setTimeout(() => {
      const client = mqtt.connect(`wxs://${host}/mqtt`, options) // 连接MQTT服务器
      this.client = client; // 保存客户端实例

      client.on('connect', () => {
        // 连接成功的回调
        wx.hideLoading(); // 隐藏加载提示
        console.log('服务器连接成功'); // 控制台输出连接成功信息
        this.setData({
          isConnected: true // 更新连接状态为已连接
        });
        wx.showToast({
          title: '服务器连接成功', // 提示用户连接成功
          icon: 'success',
          duration: 1500 // 提示持续时间
        });
      });

      client.on('reconnect', (error) => {
        // 重连的回调
        reconnectAttempts++; // 增加重连尝试次数
        console.log('正在重连:', error); // 控制台输出重连信息

        if (reconnectAttempts > 10) {
          // 如果重连次数超过10次
          console.log('重连次数超过限制，停止重连'); // 控制台输出停止重连信息
          client.end(); // 结束连接
          wx.showToast({
            title: '重连失败，已停止重连', // 提示用户重连失败
            icon: 'none',
            duration: 2000 // 提示持续时间
          });
        }
      });

      client.on('error', (error) => {
        // 连接失败的回调
        wx.hideLoading(); // 隐藏加载提示
        console.log('连接失败:', error); // 控制台输出连接失败信息
        client.end(); // 结束连接
        this.setData({
          isConnected: false // 更新连接状态为未连接
        });
        wx.showToast({
          title: '连接失败，已停止连接', // 提示用户连接失败
          icon: 'none',
          duration: 2000 // 提示持续时间
        });
      });
    }, 800); // 延迟800毫秒后尝试连接
  },

// pages/view/view.js

/**
 * 添加发布者的函数
 */
addPublisher() {
  const that = this; // 保存上下文

  // 弹出对话框让用户输入发布路径
  wx.showModal({
      title: '输入发布路径',
      content: '',
      editable: true,
      success(res) {
          if (res.confirm) {
              const sendPath = res.content; // 获取用户输入的路径

              // 检查MQTT客户端是否连接
              if (that.client) {
                  // 更新数据并显示
                  that.setData({
                      sendPathVisible: true, // 设置为可见
                      sendPath: sendPath // 保存用户输入的路径
                  });

                  wx.showToast({
                      title: '发布路径设置成功',
                      icon: 'success',
                      duration: 1500
                  });
              } else {
                  wx.showToast({
                      title: 'MQTT客户端未连接',
                      icon: 'error',
                      duration: 1500
                  });
              }
          } else if (res.cancel) {
              console.log('用户取消输入'); // 控制台输出用户取消信息
          }
      }
  });
},

/**
* 添加订阅者的函数
*/
addSubscriber() {
  const that = this; // 保存上下文

  // 弹出对话框让用户输入订阅路径
  wx.showModal({
      title: '输入订阅路径',
      content: '',
      editable: true,
      success(res) {
          if (res.confirm) {
              const subscriptionPath = res.content; // 获取用户输入的路径

              // 检查MQTT客户端是否连接
              if (that.client) {
                  that.client.subscribe(subscriptionPath, { qos: 0 }, (err) => {
                      if (!err) {
                          console.log('订阅成功:', subscriptionPath); // 控制台输出订阅成功信息
                          wx.showToast({
                              title: '订阅成功',
                              icon: 'success',
                              duration: 1500
                          });

                          // 增加消息监听
                          that.client.on('message', (topic, message) => {
                              console.log('收到消息:', message.toString());
                              try {
                                  const data = JSON.parse(message.toString());
                                  // 只更新存在的字段
                                  if (data.temp !== undefined) {
                                      that.setData({ temp: data.temp });
                                  }
                                  if (data.moisture !== undefined) {
                                    that.setData({ moisture: data.moisture });
                                }
                                  if (data.humi !== undefined) {
                                      that.setData({ humi: data.humi});
                                  }
                                  if (data.led1 !== undefined) {
                                      that.setData({ beepchecked: data.led1 });
                                  }
                                  if (data.led1 !== undefined) {
                                    that.setData({ beepchecked1: data.led2 });
                                }
                                  if (data.servo !== undefined) {
                                      that.setData({ ledchecked: data.servo });
                                  }
                                  console.log('更新数据:', data);
                              } catch (error) {
                                  console.error('解析消息失败:', error);
                              }
                          });

                          that.setData({
                              subscriptionPathVisible: true, // 设置为可见
                              subscriptionPath: subscriptionPath // 保存用户输入的路径
                          });
                      } else {
                          console.error('订阅失败:', err); // 控制台输出订阅失败信息
                          wx.showToast({
                              title: '订阅失败',
                              icon: 'error',
                              duration: 1500
                          });
                          that.setData({
                              subscriptionPathVisible: false // 设置为不可见
                          });
                      }
                  });
              } else {
                  wx.showToast({
                      title: 'MQTT客户端未连接',
                      icon: 'error',
                      duration: 1500
                  });
              }
          } else if (res.cancel) {
              console.log('用户取消输入'); // 控制台输出用户取消信息
          }
      }
  });
},
// pages/view/view.js

/**
 * 控制LED的函数
 */
onLedChange(e) {
  const checked = e.detail.value; // 获取开关状态
  const that = this; // 保存上下文

  // 检查sendPath是否存在且不为空
  if (that.data.sendPath) {
      const message = JSON.stringify({ servo: checked }); // 创建要发布的消息 修改这里啊
      that.client.publish(that.data.sendPath, message, { qos: 0 }, (err) => {
          if (!err) {
              console.log('门禁状态已更新:', message); // 控制台输出发布成功信息
              wx.showToast({
                  title: '门禁状态已更新',
                  icon: 'success',
                  duration: 1000
              });
          } else {
              console.error('门禁状态已更新:', err); // 控制台输出发布失败信息
              wx.showToast({
                  title: '发布失败',
                  icon: 'error',
                  duration: 1000
              });
          }
      });
  } else {
      wx.showToast({
          title: '发布路径未设置',
          icon: 'error',
          duration: 1000
      });
  }
},

/**
* 控制报警的函数
*/
onBeepChange(e) {
  const checked = e.detail.value; // 获取开关状态
  const that = this; // 保存上下文

  // 检查sendPath是否存在且不为空
  if (that.data.sendPath) {
      const message = JSON.stringify({ led1: checked }); // 创建要发布的消息
      that.client.publish(that.data.sendPath, message, { qos: 0 }, (err) => {
          if (!err) {
              console.log('路灯状态已发布:', message); // 控制台输出发布成功信息
              wx.showToast({
                  title: '路灯状态已更新',
                  icon: 'success',
                  duration: 1000
              });
          } else {
              console.error('发布路灯状态失败:', err); // 控制台输出发布失败信息
              wx.showToast({
                  title: '发布失败',
                  icon: 'error',
                  duration: 1000
              });
          }
      });
  } 
  else {
      wx.showToast({
          title: '发布路径未设置',
          icon: 'error',
          duration: 1000
      });
  }
},
onBeepChange1(e) {
  const checked = e.detail.value; // 获取开关状态
  const that = this; // 保存上下文

  // 检查sendPath是否存在且不为空
  if (that.data.sendPath) {
      const message = JSON.stringify({ led2: checked }); // 创建要发布的消息
      that.client.publish(that.data.sendPath, message, { qos: 0 }, (err) => {
          if (!err) {
              console.log('路灯状态已发布:', message); // 控制台输出发布成功信息
              wx.showToast({
                  title: '路灯状态已更新',
                  icon: 'success',
                  duration: 1000
              });
          } else {
              console.error('发布路灯状态失败:', err); // 控制台输出发布失败信息
              wx.showToast({
                  title: '发布失败',
                  icon: 'error',
                  duration: 1000
              });
          }
      });
  } 
  else {
      wx.showToast({
          title: '发布路径未设置',
          icon: 'error',
          duration: 1000
      });
  }
},
/**
 * 跳转到设置页面的函数
 */
toSettings() {
  wx.redirectTo({
    url: '/pages/logs/logs', // 跳转到设置页面
  });
},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const connectionData = wx.getStorageSync('currentConnection'); // 获取存储的连接数据
    console.log('connectionData',connectionData);
    
    if (connectionData) {
      this.setData({
        connectionInfo: connectionData // 设置连接信息
      });
      this.connectMqtt(this.data.connectionInfo); // 连接MQTT
      }
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    if (this.client) {
      this.client.end(); // 结束连接
      console.log('MQTT连接已断开'); // 控制台输出连接已断开信息
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this.client) {
      this.client.end(); // 结束连接
      console.log('MQTT连接已断开'); // 控制台输出连接已断开信息
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});