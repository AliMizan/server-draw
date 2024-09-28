import { chatWithUser, User } from "../types"


let users: User[] = []

const getUser = (userId: string) => users.find(user => user.id === userId)

const getRoomMembers = (roomId: string) =>
  users
    .filter(user => user.roomId === roomId)
    .map(({ id, username }) => ({ id, username }))

const addUser = (user: User) => users.push(user)

const removeUser = (userId: string) => {
  users = users.filter(user => user.id !== userId)
}

let chats : chatWithUser[] = []

const addChat = (chatWithUser:chatWithUser) => chats.push(chatWithUser) 

const getChats = (roomId:string) => chats.filter(chat => chat.roomId === roomId).map(({id,username,chat}) => ({id,username,chat}))




export { getUser, getRoomMembers, addUser, removeUser }
