class PaperTradeApp {
    constructor() {
        this.currentTime = '2025-02-24 16:46:03';
        this.user = 'onlineprashant2007';
        this.initializeEventListeners();
        this.startDataUpdates();
    }

    initializeEventListeners() {
        // Order form submission
        $('#orderForm').on('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });

        // Buy/Sell button handlers
        $('#buyButton').on('click', () => this.prepareOrder('BUY'));
        $('#sellButton').on('click', () => this.prepareOrder('SELL'));
    }

    async submitOrder() {
        const orderData = {
            symbol: $('#symbol').val(),
            type: $('#orderSide').val(),
            quantity: parseInt($('#quantity').val()),
            price: parseFloat($('#price').val()),
            order_type: $('#orderType').val()
        };

        try {
            const response = await fetch('/paper-trade/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            this.showNotification('Order placed successfully!', 'success');
            this.updateOrdersTable();
        } catch (error) {
            this.showNotification('Failed to place order', 'error');
        }
    }

    async updateData() {
        await Promise.all([
            this.updateAccountInfo(),
            this.updatePositions(),
            this.updateOrders(),
            this.updateTrades()
        ]);
    }

    async updateAccountInfo() {
        const response = await fetch('/paper-trade/api/account');
        const data = await response.json();
        $('#availableMargin').text(`₹${data.available_margin.toFixed(2)}`);
        $('#usedMargin').text(`₹${data.used_margin.toFixed(2)}`);
        $('#dayPnL').text(`₹${data.day_pnl.toFixed(2)}`);
    }

    async updatePositions() {
        const response = await fetch('/paper-trade/api/positions');
        const positions = await response.json();
        this.renderPositionsTable(positions);
    }

    async updateOrders() {
        const response = await fetch('/paper-trade/api/orders');
        const orders = await response.json();
        this.renderOrdersTable(orders);
    }

    async updateTrades() {
        const response = await fetch('/paper-trade/api/trades');
        const trades = await response.json();
        this.renderTradesTable(trades);
    }

    renderPositionsTable(positions) {
        const tbody = $('#positions tbody');
        tbody.empty();
        
        if (positions.length === 0) {
            tbody.html('<tr><td colspan="6" class="text-center">No open positions</td></tr>');
            return;
        }

        positions.forEach(pos => {
            const pnl = (pos.current_price - pos.avg_price) * pos.quantity;
            tbody.append(`
                <tr>
                    <td>${pos.symbol}</td>
                    <td>${pos.quantity}</td>
                    <td>₹${pos.avg_price.toFixed(2)}</td>
                    <td>₹${pos.current_price.toFixed(2)}</td>
                    <td class="${pnl >= 0 ? 'positive' : 'negative'}">
                        ₹${pnl.toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="app.closePosition('${pos.symbol}')">
                            Close
                        </button>
                    </td>
                </tr>
            `);
        });
    }

    startDataUpdates() {
        this.updateData();
        setInterval(() => this.updateData(), 5000);
        
        // Update current time
        setInterval(() => {
            const now = new Date();
            this.currentTime = now.toISOString().slice(0, 19).replace('T', ' ');
            $('#currentTime').text(this.currentTime);
        }, 1000);
    }

    showNotification(message, type) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        $('#notifications').append(alert);
        setTimeout(() => alert.alert('close'), 5000);
    }
}

// Initialize the application
$(document).ready(() => {
    window.app = new PaperTradeApp();
});