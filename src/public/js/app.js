const socket = io();

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const room = document.getElementById("room");
// const roomList = document.getElementById("roomList");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
// const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
// room.hidden = true;
const errorJoin = document.getElementById("noJoin");

call.hidden = true;
errorJoin.hidden = true;

let roomName;
let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;

function noJoin() {
    errorJoin.hidden = false;
    welcome.hidden = true;
    call.hidden = true;
}
// getMedia();
// getCameras();
// async function getCameras() {
//     try {
//         // const devices = await navigator.mediaDevices.enumerateDevices();
//         // const cameras = devices.filter(
//         //     (device) => device.kind === "videoinput"
//         // );
//         // const currentCamera = myStream.getVideoTracks()[0];
//         // cameras.forEach((camera) => {
//         //     const option = document.createElement("option");
//         //     option.value = camera.deviceId;
//         //     option.innerText = camera.label;
//         //     if (currentCamera.label === camera.label) {
//         //         option.selected = true;
//         //     }
//         // });
//     } catch (e) {
//         console.log(e);
//     }
// }
async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" }
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } }
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            // await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

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
        cameraBtn.innerText = "Turn camera off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn camera on!";
        cameraOff = true;
    }
}
// async function handleCameraChange() {
//     await getMedia(camerasSelect.value);
// }

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
// camerasSelect.addEventListener("input", handleCameraChange);
async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

// function showRoom() {
//     welcome.hidden = true;
//     room.hidden = false;
//     const h3 = room.querySelector("h3");
//     h3.innerText = `Room ${roomName}`;
//     const msgForm = room.querySelector("#msg");
//     msgForm.addEventListener("submit", handleMessageSubmit);
// }

async function handleWelcomeSubmit(event) {
    // console.log(event);
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// function displayRooms(currentRooms) {
//     const rooms = welcome.querySelector("ul");
//     welcome.querySelector("ul").innerHTML = "";
//     //delete lis in rooms

//     if (currentRooms && currentRooms.length > 0) {
//         currentRooms.forEach(renderProductList);

//         function renderProductList(element, index, arr) {
//             var li = document.createElement("li");
//             li.setAttribute("class", "item");
//             rooms.appendChild(li);
//             li.innerHTML = li.innerHTML + element;
//         }
//     }
// // }
// socket.on("show_rooms", (rooms) => {
//     // console.log("rooms: ", rooms);
//     displayRooms(rooms);
// });

// socket.on("new_message", addMessage);
// ///////////////////////////////////////////////////////////////
// socket.on("welcome", (user) => {
//     addMessage(`${user} arrived!!`);
// });

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});
//첫번째 사이트에서 실행할 코드 위에꺼

socket.on("offer", async (offer) => {
    // console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer: ", answer);
});
// 2번째 사이트가 받을코드

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
    console.log("received the answer: ", answer);
});

socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
    console.log("received candidate: ", ice);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("sent candidate!!");
    socket.emit("ice", data.candidate, roomName);
    console.log("data: ", data);
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    console.log("got my peer=data: ", data);
    peerFace.srcObject = data.stream;
}
socket.on("no_join", () => {
    noJoin();
});
