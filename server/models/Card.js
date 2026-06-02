import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    gameId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    race: {
      type: String,
      required: true,
      trim: true,
    },
    species: {
      type: String,
      required: true,
      trim: true,
    },
    rarity: {
      type: String,
      enum: ['Common', 'Rare', 'Epic', 'Legendary', 'Unknown'],
      default: 'Unknown',
    },
    attack: {
      type: Number,
      default: 0,
      min: 0,
    },
    defense: {
      type: Number,
      default: 0,
      min: 0,
    },
    health: {
      type: Number,
      default: 1,
      min: 1,
    },
    ability: {
      type: String,
      default: '',
      trim: true,
    },
    collected: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

cardSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject.gameId;
    delete returnedObject._id;
    delete returnedObject.gameId;
    return returnedObject;
  },
});

export const Card = mongoose.model('Card', cardSchema);
