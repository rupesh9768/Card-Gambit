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

const questSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    xpReward: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinsReward: {
      type: Number,
      default: 0,
      min: 0,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const achievementSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
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
    starterPackOpened: {
      type: Boolean,
      default: false,
    },
    starterPackOpenedAt: {
      type: Date,
      default: null,
    },
    firstDuelCompleted: {
      type: Boolean,
      default: false,
    },
    firstDuelCompletedAt: {
      type: Date,
      default: null,
    },
    winStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestWinStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDuels: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPacksOpened: {
      type: Number,
      default: 0,
      min: 0,
    },
    duelDropPity: {
      type: Number,
      default: 0,
      min: 0,
    },
    packPity: {
      epic: {
        type: Number,
        default: 0,
        min: 0,
      },
      legendary: {
        type: Number,
        default: 0,
        min: 0,
      },
      unknown: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    dailyQuestDate: {
      type: String,
      default: '',
    },
    dailyQuests: {
      type: [questSchema],
      default: [],
    },
    achievements: {
      type: [achievementSchema],
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
