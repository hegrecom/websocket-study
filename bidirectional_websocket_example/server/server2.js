import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss  = new WebSocketServer({ port: 8182 });
let client_index = 1;
let clients = [];

wss.on('connection', (ws) => {
  const client_uuid = uuidv4();
  let nickname = `AnonymousUser_${client_index}`;
  client_index += 1;
  clients.push({ 'id': client_uuid, 'ws': ws, 'nickname': nickname });
  console.log(`Client ${client_uuid} connected`);

  const sendMessage = (type, client_uuid, nickname, message) => {
    clients.forEach((client) => {
      const socket = client.ws;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          'type': type,
          'id': client_uuid,
          'message': message,
          'nickname': nickname
        }));
      }
    });
  }

  let connect_message = `${nickname} has connected`;
  sendMessage('notification', client_uuid, nickname, connect_message);

  ws.on('message', (message) => {
    let messageDecoder = new TextDecoder("utf-8");
    message = messageDecoder.decode(message);
    console.log(`Sending message to ${client_uuid}: ${message}`);
    if (message.indexOf('/nick') === 0) {
      let nickname_array = message.split(' ');
      if (nickname_array.length >= 2) {
        let old_nickname = nickname;
        nickname = nickname_array[1];
        let nickname_message = `Client ${old_nickname} changed to ${nickname}`;
        sendMessage('nick_update', client_uuid, nickname, nickname_message);
      }
    } else {
      sendMessage('message', client_uuid, nickname, message);
    }
  });

  const closeSocket = () => {
    let disconnect_message = `${nickname} has disconnected`;
    sendMessage('notification', client_uuid, nickname, disconnect_message);
    clients = clients.filter((client) => {
      return client.id !== client_uuid;
    });
  }

  ws.on('close', () => {
    closeSocket();
  });

  process.on('SIGINT', () => {
    console.log('Closing things');
    closeSocket();
    process.exit();
  });
});
