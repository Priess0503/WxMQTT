var mqtt = require('../../utils/mqtt.min.js') // 引入MQTT库
var client = null // 初始化MQTT客户端为null

Page({
    data: {
        clientId: '', // 客户端ID
        host: '', // 主机地址
        username: '', // 用户名
        password: '', // 密码
        connectDisabled: true // 连接按钮是否禁用
    },

    // 输入信息处理函数
    input_msg: function(e) {     
        const id = e.currentTarget.dataset.id; // 从事件中获取输入框的ID
        console.log(id, ':', e.detail.value); // 输出输入框ID和对应的值
        const value = e.detail.value; // 获取输入框的值
        this.setData({
            [id]: value // 更新对应的输入框值
        });

        // 检查所有输入框是否都有数据
        const { clientId, host, username, password } = this.data; // 获取当前输入的数据
        const allFieldsFilled = clientId && host && username && password; // 检查是否所有字段都有值
        this.setData({
            connectDisabled: !allFieldsFilled // 如果所有字段都有值，则启用连接按钮
        });
    },

    // 生成随机 Client Id
    generateClientId: function() {
        const randomId = 'wsdhy' + Math.floor(10000 + Math.random() * 90000); // 生成 wsdhy+5位随机数字
        this.setData({
            clientId: randomId // 更新 clientId
        });
        console.log('生成的 Client Id:', randomId); // 输出生成的 Client Id
    },

    /**
     * 连接并跳转到 view 页面
     */
    connectAndNavigate: function() {
        const { clientId, host, username, password } = this.data; // 获取输入的数据
    
        // 从本地存储获取连接信息
        const connections = wx.getStorageSync('connections') || []; // 获取连接信息
    
        // 检查当前连接信息是否已存在
        const exists = connections.some(connection => 
            connection.id === clientId && 
            connection.url === host 
        );
    
        if (!exists) {
            // 如果连接信息不存在，保存连接信息到本地
            const connection = {
                status: 'Connected', // 连接状态
                url: host, // 主机地址
                id: clientId, // 客户端ID
                username: username, // 用户名
                password: password // 密码
            };
            connections.push(connection); // 添加新的连接信息
            wx.setStorageSync('connections', connections); // 保存到本地存储
        } else {
            console.log('连接信息已存在，不再保存'); // 控制台输出连接信息已存在
        }
    
        // 更新 currentConnection
        wx.setStorageSync('currentConnection', {
            status: 'Connected',
            url: host,
            id: clientId,
            username: username,
            password: password
        });
    
        // 跳转到 view 页面
        wx.redirectTo({
            url: '/pages/view/view',
            success: function(res) {
                // 通过事件通道传递数据
                // 这里不再需要 emit，因为已经更新了 currentConnection
            }
        });
    },

    onShow() {
        // 从本地存储获取连接数据
        const connectionData = wx.getStorageSync('currentConnection'); // 获取存储的连接数据
        if (connectionData) {
            console.log('接收到的连接信息:', connectionData); // 控制台输出接收到的数据
            this.setData({
                clientId: connectionData.id, // 设置客户端ID
                host: connectionData.url, // 设置主机地址
                username: connectionData.username, // 设置用户名
                password: connectionData.password, // 设置密码
                connectDisabled: false // 启用连接按钮
            });
        }
    }
});