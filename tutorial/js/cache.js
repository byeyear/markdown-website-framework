// 缓存模块

// 缓存配置
export const CACHE_CONFIG = {
    menuData: 'tutorial_menu_cache_v1',
    content: 'tutorial_content_cache_v1',
    expiry: 24 * 60 * 60 * 1000 // 24小时缓存
};

// 缓存工具函数
export const cacheUtil = {
    // 设置缓存
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('缓存设置失败:', e);
        }
    },
    
    // 获取缓存
    get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_CONFIG.expiry) {
                return data;
            }
            // 缓存过期，清除
            localStorage.removeItem(key);
            return null;
        } catch (e) {
            console.warn('缓存获取失败:', e);
            return null;
        }
    },
    
    // 清除缓存
    clear(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('缓存清除失败:', e);
        }
    }
};
