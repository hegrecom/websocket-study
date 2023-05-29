const net = require('net');
const crypto = require('crypto');

function generateHandshakeResponse(key) {
  const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'; // WebSocket GUID
  const combined = key + GUID;
  const sha1 = crypto.createHash('sha1');
  sha1.update(combined);
  const responseKey = sha1.digest('base64');
  const response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${responseKey}`,
    '',
    ''
  ].join('\r\n');
  return response;
}

function parseFrame(frame) {
  const fin = (frame[0] & 0x80) !== 0;
  const opcode = frame[0] & 0x0F;
  const masked = (frame[1] & 0x80) !== 0;
  const payloadLength = frame[1] & 0x7F;

  let payloadStartIndex;
  if (payloadLength <= 125) {
    payloadStartIndex = masked ? 6 : 2;
  } else if (payloadLength === 126) {
    payloadStartIndex = masked ? 8 : 4;
  } else {
    payloadStartIndex = masked ? 14 : 10;
  }

  let payload = frame.slice(payloadStartIndex);
  let maskKey;
  if (masked) {
    maskKey = frame.slice(payloadStartIndex - 4, payloadStartIndex);
  }

  return { fin, opcode, masked, payloadLength, maskKey, payload };
}

function getPayload(frame) {
  let payload = frame.payload;
  if (frame.masked) {
    payload = unmaskPayload(frame.maskKey, payload);
  }

  return payload;
}

function unmaskPayload(maskKey, payload) {
  const unmaskedPayload = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    unmaskedPayload[i] = payload[i] ^ maskKey[i % 4];
  }
  return unmaskedPayload;
}

function createFrame(payload) {
  const fin = true;
  const opcode = 0x01; // Text frame
  const masked = false;
  const payloadLength = payload.length;

  const frameHeader = [
    (fin << 7) | opcode,
    (masked << 7) | payloadLength
  ];

  const frame = Buffer.concat([Buffer.from(frameHeader), payload]);
  return frame;
}

function handleClient(socket) {
  socket.on('data', (data) => {
    const request = data.toString('utf-8');
    console.log(request);
    const match_result = request.match(/Sec-WebSocket-Key: (.+)/);
    const key = match_result ? match_result[1] : null;

    if (key) {
      const handshakeResponse = generateHandshakeResponse(key);
      socket.write(handshakeResponse, 'utf-8');

      socket.on('data', (data) => {
        console.log('Received data:', data);
        const frame = parseFrame(data);
        console.log('Received frame:', frame);
        const payload = getPayload(frame);
        console.log('Received payload:', payload.toString('utf-8'));

        const response = 'Server says: ' + payload.toString('utf-8');
        const responseFrame = createFrame(Buffer.from(response, 'utf-8'));
        socket.write(responseFrame);
      });
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
}

function main() {
  const server = net.createServer((socket) => {
    console.log('Client connected');

    handleClient(socket);
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main();
