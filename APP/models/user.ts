import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  displayName: string;
  email: string;
  photoURL?: string;
  uid?: string; 
  password?: string; 
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photoURL: { type: String },
  uid: { type: String, unique: true, sparse: true }, 
  password: { type: String }, 
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
