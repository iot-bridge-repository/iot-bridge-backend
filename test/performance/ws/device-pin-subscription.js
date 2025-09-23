import ws from 'k6/ws';
import { check } from 'k6';

export default function wsDevicePinSubscription(deviceId, pin, timeSeconds) {
  const url = 'ws://localhost:3001';
  const topic = `device-id/${deviceId}/pin/${pin}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'subscribe',
        topic: topic,
      }));

      socket.setTimeout(() => {
        socket.close();
      }, timeSeconds * 1000);
    });

    socket.on('error', (e) => {
      console.error('WebSocket error:', e.error());
    });
  });

  const checkRes = check(res, {
    'websocket connection success': (r) => r && r.status === 101,
  });
  if (!checkRes) {
    fail(`websocket connection failed by virtual user with id ${__VU}, status: ${res.status}, body: ${res.body}`);
  }
}
