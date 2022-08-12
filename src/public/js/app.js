const socket = io();

const welcom = document.getElementById("welcome");
const form = welcom.querySelector("form");
const room = document.getElementById("room");
const roomList = document.getElementById("roomList");

room.hidden = true;

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function showRoom() {
    welcom.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function showRoomList() {
    const input = room.querySelector("#roomList div");
    const value = input.value;
    input.innerText = `RoomList ${roomName}`;
    socket.emit("roomList", input.value, () => {
        addMessage(`${value}`);
    });
    socket.on("roomList", (roomName) => {
        addMessage(`roomList : ${roomName}`);
    });
    roomList.value = "";
}
function handleRoomSubmit(event) {
    console.log(event);
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

function displayRooms(currentRooms) {
    const rooms = welcome.querySelector("ul");
    console.log("currentRooms: ", currentRooms);
    if (currentRooms && currentRooms.length > 0) {
        if (
            rooms.getElementsByTagName("li").length === 0 ||
            rooms.getElementsByTagName("li").length !== currentRooms.length
        ) {
            console.log("here");
            currentRooms.forEach(renderProductList);

            function renderProductList(element, index, arr) {
                var li = document.createElement("li");
                li.setAttribute("class", "item");
                rooms.appendChild(li);
                li.innerHTML = li.innerHTML + element;
            }
        }
    }
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user) => {
    addMessage(`${user} arrived!!`);
});

socket.on("bye", (left) => {
    addMessage(`${left} left byebye`);
});

socket.on("show_rooms", (rooms) => {
    console.log("rooms: ", rooms);
    displayRooms(rooms);
});

socket.on("new_message", addMessage);
