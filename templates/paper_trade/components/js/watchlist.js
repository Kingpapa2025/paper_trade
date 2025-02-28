let selectedSymbols = new Set();
let previousPrices = {};

// WebSocket Connection
const socket = io();

socket.on('connect', () => {
    console.log('Connected to WebSocket');
    updateButtonStates(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
    updateButtonStates(false);
});

socket.on('market_data_update', (data) => {
    updateWatchlistRow(data);
});

function updateWatchlistRow(data) {
    const rowId = `row-${data.symbol}-${data.exchange}`;
    let row = document.getElementById(rowId);
    
    if (!row) {
        row = createNewRow(data);
    }

    const prevPrice = previousPrices[data.symbol] || data.closed_price;
    updatePriceCell(row, 'ltp', data.closed_price, prevPrice);
    updatePriceCell(row, 'open', data.open_price_of_the_day);
    updatePriceCell(row, 'high', data.high_price_of_the_day);
    updatePriceCell(row, 'low', data.low_price_of_the_day);
    updatePriceCell(row, 'close', data.closed_price);
    
    // Update volume
    row.querySelector('.volume').textContent = data.volume_trade_for_the_day;
    
    // Update timestamp
    row.querySelector('.timestamp').textContent = formatTime(data.timestamp);

    previousPrices[data.symbol] = data.closed_price;
}

function createNewRow(data) {
    const row = document.createElement('tr');
    row.id = `row-${data.symbol}-${data.exchange}`;
    row.innerHTML = `
        <td>
            <input type="checkbox" class="checkbox checkbox-xs" 
                   onchange="toggleSymbol('${data.symbol}', '${data.exchange}', '${data.token}')">
        </td>
        <td>${data.symbol}</td>
        <td>${data.exchange}</td>
        <td>${data.token}</td>
        <td class="timestamp">${formatTime(data.timestamp)}</td>
        <td class="ltp price-cell">${data.closed_price}</td>
        <td class="open price-cell">${data.open_price_of_the_day}</td>
        <td class="high price-cell">${data.high_price_of_the_day}</td>
        <td class="low price-cell">${data.low_price_of_the_day}</td>
        <td class="close price-cell">${data.closed_price}</td>
        <td class="volume">${data.volume_trade_for_the_day}</td>
    `;
    document.getElementById('watchlistBody').appendChild(row);
    return row;
}

function updatePriceCell(row, className, newPrice, prevPrice = null) {
    const cell = row.querySelector(`.${className}`);
    const formattedPrice = Number(newPrice).toFixed(2);
    
    if (prevPrice !== null) {
        const priceClass = newPrice > prevPrice ? 'text-success' : 
                          newPrice < prevPrice ? 'text-error' : '';
        cell.className = `${className} price-cell ${priceClass}`;
    }
    
    cell.textContent = formattedPrice;
    cell.classList.add('animate-flash');
    setTimeout(() => cell.classList.remove('animate-flash'), 500);
}

// Symbol Search and Add
async function searchSymbols(query) {
    if (query.length < 2) return;
    
    try {
        const response = await fetch(`/api/search_symbols?q=${query}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = data.map(symbol => `
            <div class="p-2 hover:bg-base-200 cursor-pointer"
                 onclick="selectSymbol('${symbol.symbol}', '${symbol.exchange}', '${symbol.token}')">
                ${symbol.symbol} - ${symbol.exchange}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching symbols:', error);
    }
}

async function selectSymbol(symbol, exchange, token) {
    try {
        const response = await fetch('/ws/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbol, exchange, token })
        });
        
        const data = await response.json();
        if (data.success) {
            closeAddSymbolModal();
            showToast('Symbol added successfully', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Error adding symbol', 'error');
    }
}

// WebSocket Control Functions
async function startWebSocket() {
    try {
        const response = await fetch('/ws/start', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            updateButtonStates(true);
            showToast('WebSocket started', 'success');
        }
    } catch (error) {
        showToast('Error starting WebSocket', 'error');
    }
}

async function stopWebSocket() {
    try {
        const response = await fetch('/ws/stop', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            updateButtonStates(false);
            showToast('WebSocket stopped', 'success');
        }
    } catch (error) {
        showToast('Error stopping WebSocket', 'error');
    }
}

// Utility Functions
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed bottom-4 right-4 w-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateButtonStates(isConnected) {
    document.getElementById('startBtn').disabled = isConnected;
    document.getElementById('stopBtn').disabled = !isConnected;
    document.getElementById('subscribeBtn').disabled = !isConnected;
    document.getElementById('unsubscribeBtn').disabled = !isConnected;
}

// Modal Controls
function showAddSymbolModal() {
    document.getElementById('addSymbolModal').showModal();
}

function closeAddSymbolModal() {
    document.getElementById('addSymbolModal').close();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
});