// Put all your frontend code here.
import WebSocket from "ws";
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");
const nickForm = document.querySelector("#nick");

function handleOpen() {
    console.log("connected to Server!");
}

WebSocket.addEventListener("open", handleOpen);

WebSocket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
    console.log("New message: ", message.data);
});

WebSocket.addEventListener("close", () => {
    console.log("Disconnected from Server! ");
});

function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    WebSocket.send(input.value);
    input.value = "";
}

function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    WebSocket.send(makeMessage("nickname", input.value));
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
