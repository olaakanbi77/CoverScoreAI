let WebSocket;
try {
  WebSocket = require('ws');
} catch (e) {
  console.warn('[WS] ws module not available — WebSocket disabled');
  WebSocket = null;
}

class NotificationServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  attach(server) {
    if (!WebSocket) {
      console.warn('[WS] Skipping attach — ws module not available');
      return;
    }

    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = parseInt(url.searchParams.get('userId'));
      const role = url.searchParams.get('role') || 'sales';

      if (!userId) {
        ws.close(4001, 'userId required');
        return;
      }

      ws.userId = userId;
      ws.role = role;
      ws.isAlive = true;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId).push(ws);

      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('close', () => {
        const list = this.clients.get(userId);
        if (list) {
          const idx = list.indexOf(ws);
          if (idx >= 0) list.splice(idx, 1);
          if (list.length === 0) this.clients.delete(userId);
        }
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'Notifications active' }));
    });

    this._interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('[WS] Notification server attached');
  }

  sendToUser(userId, notification) {
    if (!WebSocket) return false;
    const list = this.clients.get(userId);
    if (!list) return false;
    const payload = JSON.stringify(notification);
    list.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
    return true;
  }

  sendToRole(role, notification) {
    if (!WebSocket) return 0;
    let sent = 0;
    for (const [, list] of this.clients) {
      for (const ws of list) {
        if (ws.role === role && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
          sent++;
        }
      }
    }
    return sent;
  }

  broadcast(notification) {
    if (!this.wss) return 0;
    const payload = JSON.stringify(notification);
    let sent = 0;
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        sent++;
      }
    });
    return sent;
  }

  close() {
    if (this._interval) clearInterval(this._interval);
    if (this.wss) this.wss.close();
  }
}

module.exports = new NotificationServer();
