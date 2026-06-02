import mongoose from 'mongoose';

const userCardSchema = new mongoose.Schema(
  {
    cardId: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    coins: {
      type: Number,
      default: 100,
      min: 0,
    },
    cards: {
      type: [userCardSchema],
      default: [],
    },
    deck: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

userSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.password;
    return returnedObject;
  },
});

export const User = mongoose.model('User', userSchema);
