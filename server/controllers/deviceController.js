/**
 * 设备控制器
 */
const { query } = require('../config/db');

/**
 * 获取用户的所有设备
 * @param {string} wxId - 微信openid
 */
async function getDevices(wxId) {
    try {
        const sql = `
            SELECT device_id, name, type, topic, publish_topic, on_command, off_command 
            FROM device_info 
            WHERE wx_id = ? 
            ORDER BY create_time DESC
        `;
        const devices = await query(sql, [wxId]);
        
        // 转换数据库字段名为前端需要的格式
        const formattedDevices = devices.map(device => ({
            id: device.device_id,
            name: device.name,
            type: device.type,
            topic: device.topic,
            publishTopic: device.publish_topic,
            onCommand: device.on_command,
            offCommand: device.off_command,
            showChart: true
        }));
        
        return {
            success: true,
            data: formattedDevices
        };
    } catch (error) {
        console.error('获取设备列表失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 添加设备
 * @param {string} wxId - 微信openid
 * @param {object} device - 设备信息
 */
async function addDevice(wxId, device) {
    try {
        const sql = `
            INSERT INTO device_info 
            (device_id, wx_id, name, type, topic, publish_topic, on_command, off_command) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            device.id,
            wxId,
            device.name,
            device.type,
            device.topic || null,
            device.publishTopic || null,
            device.onCommand || null,
            device.offCommand || null
        ];
        
        await query(sql, params);
        
        return {
            success: true,
            data: device
        };
    } catch (error) {
        console.error('添加设备失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 更新设备
 * @param {string} wxId - 微信openid
 * @param {object} device - 设备信息
 */
async function updateDevice(wxId, device) {
    try {
        const sql = `
            UPDATE device_info 
            SET name = ?, type = ?, topic = ?, publish_topic = ?, 
                on_command = ?, off_command = ?, update_time = CURRENT_TIMESTAMP 
            WHERE device_id = ? AND wx_id = ?
        `;
        const params = [
            device.name,
            device.type,
            device.topic || null,
            device.publishTopic || null,
            device.onCommand || null,
            device.offCommand || null,
            device.id,
            wxId
        ];
        
        const result = await query(sql, params);
        
        return {
            success: result.affectedRows > 0,
            data: device
        };
    } catch (error) {
        console.error('更新设备失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 删除设备
 * @param {string} wxId - 微信openid
 * @param {string} deviceId - 设备ID
 */
async function deleteDevice(wxId, deviceId) {
    try {
        const sql = 'DELETE FROM device_info WHERE device_id = ? AND wx_id = ?';
        const result = await query(sql, [deviceId, wxId]);
        
        return {
            success: result.affectedRows > 0
        };
    } catch (error) {
        console.error('删除设备失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 批量同步设备
 * @param {string} wxId - 微信openid
 * @param {array} devices - 设备列表
 */
async function syncDevices(wxId, devices) {
    try {
        // 先删除用户的所有设备
        const deleteSql = 'DELETE FROM device_info WHERE wx_id = ?';
        await query(deleteSql, [wxId]);
        
        // 批量插入新设备
        if (devices && devices.length > 0) {
            const insertSql = `
                INSERT INTO device_info 
                (device_id, wx_id, name, type, topic, publish_topic, on_command, off_command) 
                VALUES ?
            `;
            
            const values = devices.map(device => [
                device.id,
                wxId,
                device.name,
                device.type,
                device.topic || null,
                device.publishTopic || null,
                device.onCommand || null,
                device.offCommand || null
            ]);
            
            // 使用原生连接执行批量插入
            const { pool } = require('../config/db');
            const connection = await pool.getConnection();
            await connection.query(insertSql, [values]);
            connection.release();
        }
        
        return {
            success: true,
            data: devices
        };
    } catch (error) {
        console.error('同步设备失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    syncDevices
};

