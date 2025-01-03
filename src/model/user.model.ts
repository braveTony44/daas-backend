import { Schema, model, Document, Types } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  databaseInstances: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  databaseInstances: [{ type: Schema.Types.ObjectId, ref: 'DatabaseInstance' }]
},{timestamps:true});


const User = model<IUser>('User', UserSchema);

export { User, IUser };
