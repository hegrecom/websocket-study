var socket = WebSocket("ws://echo.websocket.org");

socket.onopen = function() {
  console.log("Connection established");

  let label = document.getElementById("status-label");
  label.innerHTML = "Connection established";
}

socket.onmessage = function(event) {
  if (typeof event.data === "string") {
    let label = document.getElementById("status-label");
    label.innerHTML = event.data;
  }
}

socket.onclose = function(event) {
  console.log("Connection closed");

  let code = event.code;
  let reason = event.reason;
  let wasClean = event.wasClean;

  let label = document.getElementById("status-label");

  if (wasClean) {
    label.innerHTML = "Connection closed normally";
  } else {
    label.innerHTML = "Connection closed with message: " + reason + " (Code: " + code + ")";
  }
}

socket.onerror = function(event) {
  console.log("Error occurred.");

  let label = document.getElementById("status-label");
  label.innerHTML = "Error : " + event;
}

let textView = document.getElementById("text-view");
let buttonSend = document.getElementById("send-button");
let buttonStop = document.getElementById("stop-button");

buttonSend.onclick = function() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(textView.value);
    textView.value = "";
  }
}

buttonStop.onclick = function() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "Deliberate disconnection");
  }
}

