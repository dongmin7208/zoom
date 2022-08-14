import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);
const current_rooms = [];

let people_limit = {};

// function publicRooms() {
//     const {
//         sockets: {
//             adapter: { sids, rooms },
//         },
//     } = wsServer;
//     const publicRooms = [];
//     rooms.forEach((_, key) => {
//         if (sids.get(key) === undefined) {
//             publicRooms.push(key);
//         }
//     });
//     return publicRooms;
// }

// function countRoom(roomName) {
//     if (wsServer.sockets.adapter.rooms.get(roomName) <= 2) {
//         return wsServer.sockets.adapter.rooms.get(roomName)?.size;
//     }
//     // return wsServer.sockets.adapter.rooms.get(roomName)?.size;
// }

wsServer.on("connection", (socket) => {
    // socket["nickname"] = "Anonymous";
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
        wsServer.sockets.emit("show_rooms", current_rooms);
    });

    socket.on("join_room", (roomName) => {
        // if (!current_rooms.includes(roomName)) {
        //     current_rooms.push(roomName);
        // }
        if (!(roomName in people_limit)) {
            people_limit[roomName] = 0;
        }
        if (people_limit[roomName] > 1) {
            socket.emit("no_join");
        } else {
            people_limit[roomName] += 1;
            socket.join(roomName);
            socket.to(roomName).emit("welcome");
        }
        // const people_limit = {
        //     roomName: 0,
        // };
        // if (roomName in people_limit && people_limit[roomName] < 2) {
        //     socket.emit("no_join");
        //     console.log("no");
        // } else {
        //     // call.hidden = true;
        //     socket.join(roomName);
        //     socket.to(roomName).emit("welcome");
        //     console.log("yes");
        // }
        // console.log(roomName);

        // wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
