import mongoose from "mongoose";

const user = new mongoose.Schema({
    name:{
        type : String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    marks:{
        type:Number,
        required:true,
    },
    certificateGenerated: {
        type: String, 
        //default: false, 
    },
})

const Users = mongoose.model("Users",user);

export default Users;