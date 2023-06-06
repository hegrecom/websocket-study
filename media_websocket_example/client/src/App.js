import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
} from "@mui/material";

const MessageSection = ({ index, messages, socket }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const uploadFile = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    socket.send(file);
  };

  const handleTextMessage = (type, nickname, id, messageText, messageIndex) => {
    let textColor = "inherit";
    let fontWeight = "inherit";

    if (type === "notification") {
      textColor = "red";
      fontWeight = "bold";
    } else if (type === "nick_update") {
      textColor = "blue";
      fontWeight = "bold";
    }

    let formattedMessage = messageText;
    if (type === "message") {
      formattedMessage = `${nickname} (${id}): ${messageText}`;
    }

    return (
      <Typography
        key={messageIndex}
        variant="body1"
        gutterBottom
        style={{ color: textColor, fontWeight: fontWeight }}
      >
        {formattedMessage}
      </Typography>
    );
  };

  const handleBinary = (type, nickname, id, messageContent, messageIndex) => {
    const userInfoText = `${nickname} (${id}):`;
    window.URL = window.URL || window.webkitURL;
    const messageArrayBuffer = Uint8Array.from(messageContent.data);
    const messageBlob = new Blob([messageArrayBuffer]);

    const urlFromBlob = window.URL.createObjectURL(messageBlob);

    if (type === "image") {
      return (
        <Box key={messageIndex} style={{ display: "flex" }}>
          <Typography variant="body1" gutterBottom>
            {userInfoText}
          </Typography>
          <img
            src={urlFromBlob}
            alt="image_uploaded"
            style={{ maxWidth: "50%", maxHeight: "20%" }}
          />
        </Box>
      );
    } else if (type === "video") {
      return (
        <Box key={messageIndex} style={{ display: "flex" }}>
          <Typography variant="body1" gutterBottom>
            {userInfoText}
          </Typography>
          <video
            src={urlFromBlob}
            alt="video_uploaded"
            style={{ maxWidth: "50%", maxHeight: "20%" }}
            controls
          />
        </Box>
      );
    } else {
      return (
        <Box key={messageIndex} style={{ display: "flex" }}>
          <Typography variant="body1" gutterBottom>
            {userInfoText}
          </Typography>
          <a href={urlFromBlob} download>
            파일 다운로드
          </a>
        </Box>
      );
    }
  };

  return (
    <Grid item xs={12} style={{ display: "flex", height: "100%" }}>
      <Grid container>
        <Grid item xs={12} style={{ height: "fit-content" }}>
          <Typography variant="h6" gutterBottom>
            Messages from Server {index + 1}
          </Typography>
        </Grid>

        <Grid
          item
          xs={12}
          style={{
            display: "flex",
            borderRadius: "15px",
            border: "1px solid black",
            height: "100%",
          }}
          onDrop={uploadFile}
          onDragOver={(event) => event.preventDefault()}
        >
          <div
            ref={containerRef}
            style={{
              overflow: "auto",
              height: "100%",
            }}
          >
            {messages[index] &&
              messages[index].map((message, i) => {
                const { type, nickname, id, message: messageContent } = message;
                console.log(`type is ${type}`);

                if (
                  type === "message" ||
                  type === "nick_update" ||
                  type === "notification"
                ) {
                  return handleTextMessage(
                    type,
                    nickname,
                    id,
                    messageContent,
                    i
                  );
                } else {
                  return handleBinary(type, nickname, id, messageContent, i);
                }
              })}
          </div>
        </Grid>
      </Grid>
    </Grid>
  );
};

const ChatSection = ({
  index,
  serverAddresses,
  messages,
  setServerConnections,
  setServerAddresses,
  setMessages,
}) => {
  const [socket, setSocket] = useState(null);

  const connectToServer = (address, index) => {
    let newSocket = new WebSocket(address);
    newSocket.binaryType = "blob";

    newSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = [...updatedMessages[index], message];
        return updatedMessages;
      });
    });

    newSocket.addEventListener("close", () => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = [
          ...updatedMessages[index],
          `Closed connection from server ${index}`,
        ];
        return updatedMessages;
      });
    });

    setServerConnections((prevConnections) => {
      let previousConnection = prevConnections[index];
      if (previousConnection) {
        previousConnection.close();
      }
      prevConnections[index] = newSocket;
      return prevConnections;
    });

    setSocket(newSocket);
  };

  const handleServerAddressChange = (index, value) => {
    const addresses = [...serverAddresses];
    addresses[index] = value;
    setServerAddresses(addresses);
  };

  return (
    <Grid container spacing={2} style={{ height: "100%" }}>
      <Grid item xs={12} style={{ display: "block", height: "fit-content" }}>
        <Grid container spacing={1}>
          <Grid item xs={9}>
            <TextField
              label="Server Address"
              fullWidth
              value={serverAddresses[index] || ""}
              onChange={(e) => handleServerAddressChange(index, e.target.value)}
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              variant="contained"
              onClick={() => connectToServer(serverAddresses[index], index)}
              disabled={!serverAddresses[index]}
            >
              Connect
            </Button>
          </Grid>
        </Grid>
      </Grid>

      <MessageSection index={index} messages={messages} socket={socket} />

      <Divider style={{ margin: "16px 0" }} />
    </Grid>
  );
};

const MessageInput = ({ serverConnections }) => {
  const [inputMessage, setInputMessage] = useState("");

  const sendMessageToServer = (message) => {
    serverConnections.forEach((connection) => {
      if (connection) {
        connection.send(message);
      }
    });
    setInputMessage("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessageToServer(inputMessage);
    }
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Send Message to All Servers
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={9}>
          <TextField
            label="Message"
            fullWidth
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e)}
          />
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            onClick={() => sendMessageToServer(inputMessage)}
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

const WebSocketApp = () => {
  const [serverAddresses, setServerAddresses] = useState(Array(2));
  const [serverConnections, setServerConnections] = useState(Array(2));
  const [messages, setMessages] = useState(
    Array(2)
      .fill(null)
      .map(() => [])
  );

  return (
    <Box
      p={3}
      style={{ display: "flex", flexDirection: "column", height: "95vh" }}
    >
      <Typography variant="h5" gutterBottom>
        WebSockets App
      </Typography>

      <Box style={{ flexGrow: 1, overflowY: "auto" }}>
        <Grid container spacing={2} style={{ height: "100%" }}>
          {[0, 1].map((index) => (
            <Grid item xs={6} style={{ height: "100%" }}>
              <ChatSection
                index={index}
                serverAddresses={serverAddresses}
                messages={messages}
                setServerConnections={setServerConnections}
                setServerAddresses={setServerAddresses}
                setMessages={setMessages}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <MessageInput serverConnections={serverConnections} />
    </Box>
  );
};

export default WebSocketApp;
