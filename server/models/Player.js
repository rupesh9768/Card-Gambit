import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: 'Novice Battler',
      trim: true,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

playerSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    return returnedObject;
  },
});

export const Player = mongoose.model('Player', playerSchema);
