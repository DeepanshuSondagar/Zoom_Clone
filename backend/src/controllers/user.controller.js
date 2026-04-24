import httpStatus from "http-status";
import { User } from "../models/users.models.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.models.js";


const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        if (await bcrypt.compare(password, user.password)) {
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

    } catch (e) {
        console.error("Login error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong while logging in" });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Name, username and password are required"
        });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User Registered" });

    } catch (e) {
        console.error("Register error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e.message || "Something went wrong while registering" });
    }
};

const getUserHistory = async (req,res) => {
    const {token} = req.query;

    try{ 
        const user = await User.findOne({token: token})
        const meetings = await Meeting.find({user_id:user.username })
    res.json(meetings)
    }catch(e){
        res.json({message: `Something went wrong ${e}`})
    }
}

const addToHistory = async (req,res) => {
    const {token, meeting_Code} = req.body;
    try{
        const user = await User.findOne({token: token})
        const newMeeting = new Meeting({
            user_id: user.username, 
            meetingCode: meeting_Code
        })
        await newMeeting.save();
        res.status(httpsStatus.CREATED).json({message: " Addedcode to history"});
    } catch(e){
        res.json({message:`Something went wrong ${e}`})
    }
}
 
export { login, register, getUserHistory, addToHistory};
