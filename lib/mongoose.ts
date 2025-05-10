import mongoose from "mongoose";


const connectDB = async (): Promise<void> => {
    try {
        const mongoURI: string = process.env.MONGODB_URI || "mongodb://localhost:27017/WEB";
        await mongoose.connect(mongoURI);
        console.log("Connected to Database");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log("Error connecting to Database", error.message);
        } else {
            console.log("An unknown error occurred while connecting to the Database");
        }
    }
};

export default connectDB;