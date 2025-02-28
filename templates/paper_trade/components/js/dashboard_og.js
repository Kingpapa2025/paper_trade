/**
 * Paper Trading Dashboard JavaScript
 * UTC Time: 2025-02-24 14:19:40
 * User: onlineprashant2007
 */

class DashboardManager {
    constructor() {
        this.currentTime = '2025-02-24 14:19:40';
        this.user = 'onlineprashant2007';
        this.wsManager = null;
        this.toast = new ToastNotification();
        this.marketStatus = 'CLOSED';
        this.lastUpdate = null;
        
        // Initialize dashboard components
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize WebSocket connection
        this.initializeWebSocket();
        
        // Initialize margin updates
        this.initializeMarginUpdates();
        
        // Initialize P&L updates
        this.initializePnLUpdates();
        
        // Initialize time display
        this.initializeTimeDisplay();
        
        // Initialize market status
        this.updateMarketStatus();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/paper-trade/ws/dashboard`;
        
        this.wsManager = new WebSocket(wsUrl);
        
        this.wsManager.onopen = () => {
            this.toast.show('Connected to real-time updates', 'success');
            this.subscribeToUpdates();
        };
        
        this.wsManager.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.wsManager.onclose = () => {
            this.toast.show('Connection lost. Reconnecting...', 'warning');
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'margin_update':
                this.updateMarginDisplay(data.data);
                break;
            case 'pnl_update':
                this.updatePnLDisplay(data.data);
                break;
            case 'market_status':
                this.updateMarketStatus(data.status);
                break;
            case 'order_update':
                this.handleOrderUpdate(data.data);
                break;
            case 'error':
                this.toast.show(data.message, 'error');
                break;
        }
        
        this.lastUpdate = this.currentTime;
        document.getElementById('last-update').textContent = `Last Update: ${this.lastUpdate}`;
    }

    updateMarginDisplay(marginData) {
        // Update available margin
        document.getElementById('available-margin').textContent = 
            `₹${parseFloat(marginData.available).toFixed(2)}`;
        
        // Update utilized margin
        document.getElementById('utilized-margin').textContent = 
            `₹${parseFloat(marginData.utilized).toFixed(2)}`;
        
        // Update margin percentage
        const utilizationPercent = (marginData.utilized / marginData.total) * 100;
        document.getElementById('margin-utilization').style.width = `${utilizationPercent}%`;
        document.getElementById('margin-percent').textContent = `${utilizationPercent.toFixed(1)}%`;
        
        // Update margin status indicator
        const marginStatus = document.getElementById('margin-status');
        if (utilizationPercent > 80) {
            marginStatus.className = 'badge badge-error';
            marginStatus.textContent = 'High Utilization';
        } else if (utilizationPercent > 50) {
            marginStatus.className = 'badge badge-warning';
            marginStatus.textContent = 'Moderate';
        } else {
            marginStatus.className = 'badge badge-success';
            marginStatus.textContent = 'Good';
        }
    }

    updatePnLDisplay(pnlData) {
        // Update Unrealized P&L
        const unrealizedPnL = document.getElementById('unrealized-pnl');
        unrealizedPnL.textContent = `₹${parseFloat(pnlData.unrealized).toFixed(2)}`;
        unrealizedPnL.className = `stat-value ${pnlData.unrealized >= 0 ? 'text-success' : 'text-error'}`;
        
        // Update Realized P&L
        const realizedPnL = document.getElementById('realized-pnl');
        realizedPnL.textContent = `₹${parseFloat(pnlData.realized).toFixed(2)}`;
        realizedPnL.className = `stat-value ${pnlData.realized >= 0 ? 'text-success' : 'text-error'}`;
        
        // Update total P&L
        const totalPnL = pnlData.unrealized + pnlData.realized;
        document.getElementById('total-pnl').textContent = `₹${totalPnL.toFixed(2)}`;
        
        // Update P&L percentage
        const pnlPercent = (totalPnL / pnlData.investment) * 100;
        document.getElementById('pnl-percent').textContent = `${pnlPercent.toFixed(2)}%`;
    }

    handleOrderUpdate(orderData) {
        // Update order statistics
        const stats = {
            total: document.getElementById('total-orders'),
            pending: document.getElementById('pending-orders'),
            executed: document.getElementById('executed-orders'),
            cancelled: document.getElementById('cancelled-orders')
        };
        
        Object.keys(stats).forEach(key => {
            if (stats[key]) {
                stats[key].textContent = orderData[key];
            }
        });
        
        // Update last order info
        if (orderData.last_order) {
            const lastOrder = document.getElementById('last-order');
            lastOrder.innerHTML = `
                <div class="text-sm">
                    <span class="font-semibold">${orderData.last_order.symbol}</span>
                    <span class="badge ${orderData.last_order.type === 'BUY' ? 'badge-success' : 'badge-error'} ml-2">
                        ${orderData.last_order.type}
                    </span>
                </div>
                <div class="text-xs opacity-70">${orderData.last_order.time}</div>
            `;
        }
    }

    updateMarketStatus(status = null) {
        if (status) {
            this.marketStatus = status;
        }
        
        const statusElement = document.getElementById('market-status');
        const statusClasses = {
            'OPEN': 'badge-success',
            'CLOSED': 'badge-error',
            'PRE_OPEN': 'badge-warning',
            'POST_CLOSE': 'badge-warning'
        };
        
        statusElement.className = `badge ${statusClasses[this.marketStatus] || 'badge-ghost'}`;
        statusElement.textContent = this.marketStatus.replace('_', ' ');
    }

    initializeMarginUpdates() {
        // Add margin button handler
        document.getElementById('add-margin-btn')?.addEventListener('click', () => {
            showModal('add-margin-modal');
        });
        
        // Reset margin button handler
        document.getElementById('reset-margin-btn')?.addEventListener('click', () => {
            showModal('reset-margin-modal');
        });
    }

    initializePnLUpdates() {
        // Refresh P&L button handler
        document.getElementById('refresh-pnl-btn')?.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/paper-trade/pnl');
                const pnlData = await response.json();
                this.updatePnLDisplay(pnlData);
                this.toast.show('P&L refreshed', 'success');
            } catch (error) {
                console.error('P&L refresh error:', error);
                this.toast.show('Error refreshing P&L', 'error');
            }
        });
    }

    initializeTimeDisplay() {
        const timeElement = document.getElementById('dashboard-time');
        if (timeElement) {
            setInterval(() => {
                const now = new Date();
                timeElement.textContent = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
            }, 1000);
        }
    }

    initializeEventListeners() {
        // Window focus/blur handlers
        window.addEventListener('focus', () => {
            this.subscribeToUpdates();
        });
        
        window.addEventListener('blur', () => {
            this.unsubscribeFromUpdates();
        });
        
        // Page visibility handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.unsubscribeFromUpdates();
            } else {
                this.subscribeToUpdates();
            }
        });
    }

    subscribeToUpdates() {
        if (this.wsManager && this.wsManager.readyState === WebSocket.OPEN) {
            this.wsManager.send(JSON.stringify({
                type: 'subscribe',
                user: this.user,
                timestamp: this.currentTime
            }));
        }
    }

    unsubscribeFromUpdates() {
        if (this.wsManager && this.wsManager.readyState === WebSocket.OPEN) {
            this.wsManager.send(JSON.stringify({
                type: 'unsubscribe',
                user: this.user,
                timestamp: this.currentTime
            }));
        }
    }

    async refreshDashboard() {
        try {
            const response = await fetch('/api/paper-trade/dashboard');
            const dashboardData = await response.json();
            
            this.updateMarginDisplay(dashboardData.margin);
            this.updatePnLDisplay(dashboardData.pnl);
            this.handleOrderUpdate(dashboardData.orders);
            this.updateMarketStatus(dashboardData.market_status);
            
            this.toast.show('Dashboard refreshed', 'success');
        } catch (error) {
            console.error('Dashboard refresh error:', error);
            this.toast.show('Error refreshing dashboard', 'error');
        }
    }
}

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Export for use in other modules
export default DashboardManager;