import type { User } from "../types/user.types";

export type GetUserFilters={
    limit:number;
    page:number;
}
export const getUsers= async (filters:GetUserFilters) => {
    await new Promise(resolve=>setTimeout(resolve,1000));
    // hey co-pilot generate 10 users dummy data
    return [{
        id: "1",
        email: "user1@example.com",
        name: "User One",
        age: 25
    },{
        id: "2",
        email: "user2@example.com",
        name: "User Two",
        age: 30
    },{
        id: "3",
        email: "user3@example.com",
        name: "User Three",
        age: 35
    },{
        id: "4",
        email: "user4@example.com",
        name: "User Four",
        age: 40
    },{
        id: "5",
        email: "user5@example.com",
        name: "User Five",
        age: 45
    },{
        id: "6",
        email: "user6@example.com",
        name: "User Six",
        age: 50
    },{
        id: "7",
        email: "user7@example.com",
        name: "User Seven",
        age: 55
    },{
        id: "8",
        email: "user8@example.com",
        name: "User Eight",
        age: 60
    },{
        id: "9",
        email: "user9@example.com",
        name: "User Nine",
        age: 65
    },{
        id: "10",
        email: "user10@example.com",
        name: "User Ten",
        age: 70
    }] as User[];

}