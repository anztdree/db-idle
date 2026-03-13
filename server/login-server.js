/**
 * ============================================
 * DB-IDLE MOCK SERVER
 * Fokus: Socket Connection
 * ============================================
 */

(function() {
    'use strict';
    
    // ==================== LOG HELPER ====================
    const LOG = {
        section: (title) => {
            console.log('');
            console.log('%c═══════════════════════════════════════════════════════════', 'color: #4CAF50; font-weight: bold');
            console.log('%c ' + title, 'color: #4CAF50; font-weight: bold; font-size: 14px');
            console.log('%c═══════════════════════════════════════════════════════════', 'color: #4CAF50; font-weight: bold');
        },
        
        info: (msg) => {
            console.log('%c[MOCK] ' + msg, 'color: #2196F3');
        },
        
        success: (msg) => {
            console.log('%c[MOCK] ✓ ' + msg, 'color: #4CAF50; font-weight: bold');
        },
        
        error: (msg) => {
            console.log('%c[MOCK] ✗ ' + msg, 'color: #f44336; font-weight: bold');
        },
        
        event: (eventName) => {
            console.log('%c[MOCK] 📩 Event: ' + eventName, 'color: #9C27B0');
        },
        
        request: (type, action, data) => {
            console.log('%c[MOCK] ◄◄ REQUEST', 'color: #FF9800; font-weight: bold');
            console.log('%c      📦 Type: ' + type, 'color: #FF9800');
            console.log('%c      🎬 Action: ' + action, 'color: #FF9800');
            if (data && Object.keys(data).length > 0) {
                console.log('%c      📄 Data:', 'color: #FF9800', data);
            }
        },
        
        response: (data) => {
            console.log('%c[MOCK] ►► RESPONSE', 'color: #00BCD4; font-weight: bold');
            console.log('%c      📦 ' + JSON.stringify(data, null, 2), 'color: #00BCD4');
        },
        
        data: (label, value) => {
            console.log('%c[MOCK]   📍 ' + label + ':', 'color: #607D8B', value);
        }
    };
    
    // ==================== TEA ENCRYPTION ====================
    const TEA = {
        encrypt: function(plaintext, key) {
            LOG.info('🔐 TEA encrypt');
            LOG.data('Input', plaintext);
            
            const result = btoa(JSON.stringify({ 
                challenge: plaintext, 
                verified: true 
            }));
            
            LOG.data('Output', result);
            return result;
        }
    };
    
    // ==================== MOCK SOCKET ====================
    class MockSocket {
        constructor(url, options) {
            this.url = url;
            this.options = options || {};
            this.connected = false;
            this.eventHandlers = {};
            this.id = 'mock_' + Date.now();
            
            // Detect server type from URL or context
            this.serverType = this._detectServerType();
            
            LOG.section('🔌 SOCKET CREATED');
            LOG.data('URL', url);
            LOG.data('Options', JSON.stringify(this.options));
            LOG.data('Server Type', this.serverType);
            
            // Connect after short delay
            setTimeout(() => this._doConnect(), 50);
        }
        
        _detectServerType() {
            // Try to detect from call stack or default to login-server
            // login-server doesn't need verify, others do
            return 'login-server';
        }
        
        _doConnect() {
            this.connected = true;
            
            LOG.section('🟢 CONNECTION');
            LOG.success('Connected to ' + this.serverType);
            
            // Trigger connect event
            this._trigger('connect');
            
            // login-server doesn't need verify
            // main-server, chat-server, dungeon-server need verify
            // For now, we skip verify for login-server
        }
        
        _trigger(event, data) {
            LOG.event(event);
            
            if (this.eventHandlers[event]) {
                this.eventHandlers[event].forEach(handler => {
                    try {
                        handler(data);
                    } catch(e) {
                        LOG.error('Handler error: ' + e.message);
                    }
                });
            }
        }
        
        on(event, callback) {
            if (!this.eventHandlers[event]) {
                this.eventHandlers[event] = [];
            }
            this.eventHandlers[event].push(callback);
            return this;
        }
        
        off(event) {
            delete this.eventHandlers[event];
            return this;
        }
        
        emit(event, data, callback) {
            LOG.section('📤 EMIT: ' + event);
            
            if (event === 'verify') {
                LOG.info('🔐 Client verify response');
                LOG.data('Encrypted', data);
                
                const response = { ret: 0 };
                LOG.success('Verification accepted');
                LOG.response(response);
                
                if (callback) callback(response);
            }
            else if (event === 'handler.process') {
                LOG.request(data.type, data.action, data);
                
                // Route to appropriate handler
                let response = this._handleRequest(data);
                
                LOG.response(response);
                
                if (callback) callback(response);
            }
            else {
                LOG.info('Unknown event: ' + event);
                if (callback) callback({});
            }
            
            return this;
        }
        
        _handleRequest(data) {
            LOG.info('⏳ Processing request...');
            
            // Route by type
            switch(data.type) {
                case 'User':
                    return this._handleUser(data);
                
                default:
                    LOG.info('⚠️ Type "' + data.type + '" not implemented');
                    return { ret: 0, data: '{}', compress: false };
            }
        }
        
        _handleUser(data) {
            LOG.info('👤 User handler');
            
            switch(data.action) {
                case 'GetServerList':
                    return this._getServerList(data);
                
                default:
                    LOG.info('⚠️ Action "' + data.action + '" not implemented');
                    return { ret: 0, data: '{}', compress: false };
            }
        }
        
        _getServerList(data) {
            LOG.info('📋 Getting server list...');
            
            const serverList = [
    {
        serverId: '1',
        name: 'Server 1',
        url: 'http://127.0.0.1:8081',
        status: 1,
        hot: false,
        "new": true,
        online: true
    }
];

const responseData = {
    serverList: serverList,
    history: [],
    offlineReason: null
};
            
            return {
                ret: 0,
                data: JSON.stringify(responseData),
                compress: false
            };
        }
        
        destroy() {
            LOG.info('💥 Socket destroyed');
            this.connected = false;
            this.eventHandlers = {};
        }
        
        disconnect() {
            LOG.info('🔌 Socket disconnected');
            this.connected = false;
        }
    }
    
    // ==================== INTERCEPTOR ====================
    let checkInterval = null;
    let hasIntercepted = false;
    
    function interceptIO() {
        if (hasIntercepted) return;
        
        if (typeof window.io !== 'undefined') {
            LOG.section('🎯 INTERCEPT');
            LOG.success('window.io detected');
            
            hasIntercepted = true;
            
            // Override io.connect
            window.io.connect = function(url, options) {
                return new MockSocket(url, options);
            };
            
            LOG.success('io.connect intercepted');
            
            if (checkInterval) clearInterval(checkInterval);
        }
    }
    
    // Start
    LOG.section('🚀 MOCK SERVER START');
    LOG.info('Waiting for window.io...');
    
    interceptIO();
    checkInterval = setInterval(interceptIO, 100);
    
    setTimeout(() => {
        if (checkInterval) {
            clearInterval(checkInterval);
            if (!hasIntercepted) {
                LOG.error('Failed to intercept after 10s');
            }
        }
    }, 10000);
    
})();
