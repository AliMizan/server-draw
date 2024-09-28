import express from "express";



import { Server, type Socket } from "socket.io";
import http from "http";
import { string, z } from "zod";
import { DrawOptions, JoinRoomData } from "./types";
import { addUser, getRoomMembers, getUser, removeUser } from "./data/users";
import { addUndoPoint, deleteLastUndoPoint, getLastUndoPoint } from "./data/undoPoints";
import { joinRoomSchema } from "./lib/validations/joinRoom";
const app = express();

const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

function isRoomCreated(roomId: string) {
  const rooms = [...io.sockets.adapter.rooms];
  return rooms?.some((room) => room[0] === roomId);
}

function validateJoinRoomData(socket: Socket, joinRoomData: JoinRoomData) {
  try {
    return joinRoomSchema.parse(joinRoomData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      socket.emit("invalid-data", {
        message:
          "The entities you provided are not correct and cannot be processed.",
      });
    }
  }
}

function joinRoom(socket: Socket, roomId: string, username: string) {
  socket.join(roomId);
  const user = {
    id: socket.id,
    username,
  };

  
  addUser({ ...user, roomId });
  console.log({ ...user, roomId })
  const members = getRoomMembers(roomId);

  socket.emit("room-joined", { user, roomId, members });
  socket.to(roomId).emit("update-members", members);
  socket.to(roomId).emit("send-notification", {
    title: "A New Member!",
    message: `${username} joined.`,
  });
}

function leaveRoom(socket: Socket) {
  const user = getUser(socket.id);

  if (!user) return;

  const { username, roomId } = user;

  removeUser(socket.id);

  const members = getRoomMembers(roomId);

  socket.to(roomId).emit("update-members", members);
  socket.to(roomId).emit("send-notification", {
    title: "Member leaved!",
    message: `${username} left.`,
  });
  socket.leave(roomId);
}

io.on("connection", (socket) => {
  console.log(socket.id)
  socket.on("create-room", (joinRoomData: JoinRoomData) => {
    const validatedData = validateJoinRoomData(socket, joinRoomData);

    if (!validatedData) return;
    const { roomId, username } = validatedData;

    joinRoom(socket, roomId, username);
  });

  socket.on("join-room", (joinRoomData: JoinRoomData) => {
    const validatedData = validateJoinRoomData(socket, joinRoomData);

    if (!validatedData) return;
    const { roomId, username } = validatedData;

    if (isRoomCreated(roomId)) {
      return joinRoom(socket, roomId, username);
    }
  });


  socket.on('client-ready',(roomId:string) => {
    const members = getRoomMembers(roomId);

    if(members.length === 1) return socket.emit('client-loaded');


    const adminMember = members[0];

    if(!adminMember) return

    socket.to(adminMember.id).emit('get-canvas-state')

  })

  socket.on('send-canvas-state',({canvasState,roomId}:{canvasState:string ; roomId:string}) => {
    const members = getRoomMembers(roomId)
    const lastMember = members[members.length -1];

    if(!lastMember) return 

    socket.to(lastMember.id).emit('canvas-state-from-server',canvasState)
  });

  socket.on(
    'draw',
    ({ drawOptions, roomId }: { drawOptions: DrawOptions; roomId: string }) => {
      socket.to(roomId).emit('update-canvas-state', drawOptions)
    }
  )

  socket.on('clear-canvas',(roomId:string) => {
    socket.to(roomId).emit('clear-canvas')
  })

  socket.on('get-last-undo-point',(roomId:string) => {
    const lastUndoPoint = getLastUndoPoint(roomId);

    socket.emit('last-undo-point-from-server',lastUndoPoint)
  })


  socket.on(
    'add-undo-point',
    ({ roomId, undoPoint }: { roomId: string; undoPoint: string }) => {
      addUndoPoint(roomId, undoPoint)
    }
  )

  socket.on('undo',({canvasState,roomId} : {canvasState:string ; roomId:string}) => {
    socket.to(roomId).emit('undo-canvas',canvasState)
  })

  socket.on('delete-last-undo-point', (roomId: string) => {
    deleteLastUndoPoint(roomId)
  })

  socket.on("leave-room", () => {
    leaveRoom(socket);
  });
});

server.listen(8000, () => console.log(`Server is running on port 8000 now!`));
