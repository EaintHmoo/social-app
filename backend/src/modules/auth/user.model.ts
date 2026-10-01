import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import type { IUser, IUserMethods, UserModel } from "./auth.types.js";

// Laravel: this is your "User" Eloquent model (database/migrations + app/Models/User.php combined).
// Mongoose schema = migration (defines columns/shape) + model (query builder) in one file.
// The TypeScript shape of a user (IUser) lives in auth.types.ts, next door.
const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Laravel stores this in the "password" column too, hashed via bcrypt (Hash::make()).
    // `select: false` = like Laravel's `protected $hidden = ['password']`,
    // except this hides it at the QUERY level (won't even load from DB) unless you ask with .select("+password").
    password: { type: String, required: true, select: false },
    // NOTE: refresh tokens used to live here as a single `refreshTokenHash` column. One column
    // means one live session, so a second device would silently log the first one out. They now
    // live one-document-per-token in the RefreshToken collection — see refreshToken.model.ts.
  },
  { timestamps: true } // same idea as Laravel's created_at/updated_at timestamps
);

// Laravel: a "mutator" you'd normally set in a Model boot() or an Observer to hash on save.
// Mongoose calls this automatically right before .save() / .create() runs.
// Note: async hooks in modern Mongoose take NO `next` param — just return/await normally.
// Declaring a `next` param here makes Mongoose treat it as callback-style and it won't
// actually pass a working callback in, so calling next() throws "next is not a function".
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return; // don't re-hash if password wasn't changed
  this.password = await bcrypt.hash(this.password, 10);
});

// Laravel: Hash::check($plain, $user->password)
userSchema.methods.comparePassword = function comparePassword(plainPassword: string) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model<IUser, UserModel>("User", userSchema);
