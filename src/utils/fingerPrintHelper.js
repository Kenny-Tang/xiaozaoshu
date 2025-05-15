import FingerprintJS from '@fingerprintjs/fingerprintjs';
/**
 * 从 Cookie 获取值
 * @param {string} name - 键名
 * @returns {string|null}
 */
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }
    return null;
  }
  
  /**
   * 设置 Cookie
   * @param {string} name - 键名
   * @param {string} value - 值
   * @param {number} days - 过期天数
   * @param {string} [path='/'] - 路径
   */
  function setCookie(name, value, days, path = '/') {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=${path}`;
  }
  
  /**
   * 获取数据（优先级：Cookie → localStorage → 服务端）
   * @param {string} key - 存储的键名
   * @param {Object} [options] - 配置选项
   * @param {number} [options.cookieExpires=7] - Cookie 过期天数（默认7天）
   * @param {Function} [options.fetchFn] - 自定义服务端请求方法
   * @returns {Promise<string>} - 返回数据
   */
  export async function getClientId(key, options = {}) {
    const { cookieExpires = 7, fetchFn } = options;
    // 1. 从 Cookie 获取
    const cookieValue = await getCookie(key);
    if (cookieValue) {
      return cookieValue;
    }

    // 2. 从 localStorage 获取
    const localStorageValue = localStorage.getItem(key);
    if (localStorageValue) {
      console.log(`[getData] 从 localStorage 获取 ${key} 并更新 Cookie:`, localStorageValue);
      setCookie(key, localStorageValue, cookieExpires);
      return localStorageValue;
    }
  
    // 3. 从服务端获取
    console.log(`[getData] 未找到 ${key}，请求服务端...`);
    const serverData = fetchFn ? await fetchFn(key) : await defaultFetchFn(key);
  
    // 存储到 localStorage 和 Cookie
    localStorage.setItem(key, serverData);
    setCookie(key, serverData, cookieExpires);
  
    return serverData;
  }
  
  /**
   * 默认的服务端请求方法（可被自定义覆盖）
   * @param {string} key - 键名
   * @returns {Promise<string>}
   */
  async function defaultFetchFn(key) {
    const fpPromise = await FingerprintJS.load();
    const result = await fpPromise.get();
    const visitorId = result.visitorId;
    console.log(`[getData] 获取 ${key} : ` + visitorId)
    return visitorId;
  }