const socket = io();

const welcom = document.getElementById("welcome");
const form = welcom.querySelector("form");
const room = document.getElementById("room");
const roomList = document.getElementById("roomList");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
room.hidden = true;
const camerasSelect = document.getElementById("cameras");

let roomName;
let myStream;
let muted = false;
let cameraOff = false;

getMedia();
getCameras();

function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    // console.log(myStream.getAudioTracks());
    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = " Mute ";
        muted = false;
    }
}

function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
        cameraBtn.innerText = "Turncamera off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn camera on!";
        cameraOff = true;
    }
}

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
            (device) => device.kind === "videoinput"
        );
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        });
        console.log(cameras);
        console.log(devices);
    } catch (e) {
        console.log(e);
    }
}

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
        });
        myFace.srcObject = myStream;
    } catch (e) {
        console.log(e);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);

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
    welcome.querySelector("ul").innerHTML = "";
    const rooms = welcome.querySelector("ul");
    //delete lis in rooms

    if (currentRooms && currentRooms.length > 0) {
        currentRooms.forEach(renderProductList);

        function renderProductList(element, index, arr) {
            var li = document.createElement("li");
            li.setAttribute("class", "item");
            rooms.appendChild(li);
            li.innerHTML = li.innerHTML + element;
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
