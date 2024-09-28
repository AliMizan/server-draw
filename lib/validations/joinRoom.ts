import * as z from 'zod'

export const joinRoomSchema = z.object({
    username:z.string()
    .min(4,"Username must contain 4 characters")
    .max(20,"Username should not exceed 20 characters"),
    roomId:z.string().trim().length(21,"Room ID must contain exactly 21 characters"),
})