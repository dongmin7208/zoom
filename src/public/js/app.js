const socket = io();

const welcom = document.getElementById("welcome");
const form = welcom.querySelector("form");
const welcomForm = welcom.querySelector("form");

const room = document.getElementById("room");

const nickname = document.getElementById("nickname");
const nicknameForm = nickname.querySelector("form");

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");
const leave = document.getElementById("leave");
const leaveForm = leave.querySelector("form");

room.hidden = true;
leave.hidden = true;
call.hidden = true;

let roomName;
let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;

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
async function handleCameraChange() {
    await getMedia(camerasSelect.value);
}
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
            (device) => device.kind === "videoinput"
        );
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
        console.log("cameras: ", cameras);
        console.log("devices: ", devices);
    } catch (e) {
        console.log(e);
    }
}

// getCameras();

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}
getMedia();

async function startMedia() {
    welcom.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

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
    leave.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
    console.log(event);
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}
function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomForm.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}

function displayRooms(currentRooms) {
    // welcome.querySelector("ul").innerHTML = "";
    // const rooms = welcome.querySelector("ul");
    const rooms = welcom.querySelector("ul");

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

//RTC CODE!!
function makeConnection() {
    const myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}
function handleIce(data) {
    socket.emit("ice", data.candidate, roomName);
    console.log("got ice candidate");
    console.log("Ice: ", data);
}
function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
    console.log("handleAddStream");
    console.log("Peer stream: ", data.stream);
    console.log("Mystream: ", myStream);
}

welcomForm.addEventListener("submit", handleWelcomeSubmit);
form.addEventListener("submit", handleRoomSubmit);
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("click", handleCameraChange);

//socket code
socket.on("welcome", async (user, newCount) => {
    const h3 = room.querySelector("h3");
    const offer = await myPeerConnection.createOffer();
    h3.innerText = `Room ${roomName} (${newCount})`;
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
    addMessage(`${user} arrived!`);
});
// socket.on("welcome", async () => {
//     const offer = await myPeerConnection.createOffer();
//     myPeerConnection.setLocalDescription(offer);
//     console.log("sent the offer");
//     socket.emit("offer", offer, roomName);
// });

//server.js .to(roomName).emit("offer",offer)
socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnser();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});
socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("show_rooms", (rooms) => {
    displayRooms(rooms);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ`);
});

// socket.on("new_message", addMessage);
// if (init) {
//     init = false;
//     socket.emit("init");
// }
