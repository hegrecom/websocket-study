import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
} from "@mui/material";

const MessageSection = ({ index, messages }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        Messages from Server {index + 1}
      </Typography>

      <div ref={containerRef} style={{ maxHeight: "400px", overflow: "auto" }}>
        {messages[index] &&
          messages[index].map((message, i) => {
            const { type, nickname, id, message: messageText } = message;

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
                key={i}
                variant="body1"
                gutterBottom
                style={{ color: textColor, fontWeight: fontWeight }}
              >
                {formattedMessage}
              </Typography>
            );
          })}
      </div>
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
  const connectToServer = (address, index) => {
    const socket = new WebSocket(address);

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = [...updatedMessages[index], message];
        return updatedMessages;
      });
    });

    socket.addEventListener("close", () => {
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
      prevConnections[index] = socket;
      return prevConnections;
    });
  };

  const handleServerAddressChange = (index, value) => {
    const addresses = [...serverAddresses];
    addresses[index] = value;
    setServerAddresses(addresses);
  };

  return (
    <Grid container spacing={2}>
      <React.Fragment>
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

        <MessageSection index={index} messages={messages} />

        <Divider style={{ margin: "16px 0" }} />
      </React.Fragment>
    </Grid>
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
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        WebSockets App
      </Typography>

      <Grid container spacing={2}>
        {[0, 1].map((index) => (
          <Grid item xs={6}>
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
    </Box>
  );
};

export default WebSocketApp;
