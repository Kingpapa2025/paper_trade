// Order History JavaScript with WebSocket Implementation
// UTC Time: 2025-02-24 13:58:04
// User: onlineprashant2007

class WebSocketManager {
    constructor() {
        this.toast = new ToastNotification();
        this.tableManager = new OrderTableManager('order-history-table');
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 seconds
        this.subscribedSymbols = new Set();
    }

    connect() {
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            this.ws = new WebSocket(`${wsProtocol}//${window.location.host}/paper-trade/ws/orders`);
            
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.toast.show('Error connecting to order updates', 'error');
        }
    }

    handleOpen() {
        this.reconnectAttempts = 0;
        this.toast.show('Connected to order updates', 'success');
        
        // Resubscribe to all symbols
        this.subscribedSymbols.forEach(symbol => {
            this.subscribe(symbol);
        });

        // Update connection status in UI
        document.getElementById('connection-status')?.classList.replace('badge-error', 'badge-success');
        document.getElementById('connection-status')?.setAttribute('title', 'Connected at: ' + new Date().toISOString());
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'order_update':
                    this.handleOrderUpdate(data.data);
                    break;
                    
                case 'error':
                    this.toast.show(data.message, 'error');
                    break;
                    
                case 'subscription_success':
                    this.subscribedSymbols.add(data.symbol);
                    this.toast.show(`Subscribed to ${data.symbol} updates`, 'info');
                    break;
                    
                default:
                    console.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleClose(event) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.toast.show('Connection lost. Reconnecting...', 'warning');
            setTimeout(() => this.connect(), this.reconnectDelay);
            this.reconnectAttempts++;
        } else {
            this.toast.show('Connection lost. Please refresh the page.', 'error');
        }

        // Update connection status in UI
        document.getElementById('connection-status')?.classList.replace('badge-success', 'badge-error');
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        this.toast.show('WebSocket error occurred', 'error');
    }

    handleOrderUpdate(orderData) {
        // Update the table with new order data
        this.tableManager.updateTable([orderData]);
        
        // Show notification based on order status
        const notificationTypes = {
            'COMPLETE': 'success',
            'REJECTED': 'error',
            'CANCELLED': 'warning',
            'PENDING': 'info'
        };
        
        this.toast.show(
            `Order ${orderData.order_id} ${orderData.status.toLowerCase()}`,
            notificationTypes[orderData.status] || 'info'
        );

        // Update order statistics
        this.updateOrderStats();
    }

    subscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                symbol: symbol,
                timestamp: new Date().toISOString(),
                user: 'onlineprashant2007'
            }));
        }
    }

    unsubscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'unsubscribe',
                symbol: symbol,
                timestamp: new Date().toISOString(),
                user: 'onlineprashant2007'
            }));
            this.subscribedSymbols.delete(symbol);
        }
    }

    updateOrderStats() {
        fetch('/api/paper-trade/orders/stats')
            .then(response => response.json())
            .then(stats => {
                // Update statistics in the UI
                Object.keys(stats).forEach(key => {
                    const element = document.getElementById(`${key}-count`);
                    if (element) {
                        element.textContent = stats[key];
                    }
                });
            })
            .catch(error => {
                console.error('Error updating order stats:', error);
            });
    }
}

// Initialize WebSocket connection when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const wsManager = new WebSocketManager();
    wsManager.connect();

    // Add connection status indicator to the UI
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';
    statusIndicator.className = 'badge badge-error';
    statusIndicator.textContent = 'Connecting...';
    document.querySelector('.order-history-header')?.appendChild(statusIndicator);

    // Handle symbol subscription from search/filter
    document.getElementById('symbol-filter')?.addEventListener('change', function(e) {
        const symbol = e.target.value.toUpperCase();
        if (symbol) {
            wsManager.subscribe(symbol);
        }
    });

    // Update UTC time display
    const timeElement = document.getElementById('utc-time');
    if (timeElement) {
        setInterval(() => {
            const now = new Date();
            timeElement.textContent = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        }, 1000);
    }
});

// Export the WebSocket manager for use in other modules
export default WebSocketManager;