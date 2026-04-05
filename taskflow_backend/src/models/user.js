import { Schema, model } from 'mongoose';
import { DEFAULT_HOLIDAY_COUNTRY, SUPPORTED_HOLIDAY_COUNTRIES } from '../utils/holidayApi.js';

const roles = ['admin', 'staff', 'viewer'];

const userSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    holidayRegion: { type: String, enum: SUPPORTED_HOLIDAY_COUNTRIES, default: DEFAULT_HOLIDAY_COUNTRY },
    role: { type: String, enum: roles, default: 'staff' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = model('User', userSchema);

export default User;
