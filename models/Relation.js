import mongoose, {
  isValidObjectId
} from 'mongoose';

const {
  String,
  ObjectId
} = mongoose.Schema.Types;

const RelationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  liveStatus: {
    type: String,
    required: true,
    default: 'live',
  },
  mediaUrl: {
    type: String,
    required: false,
  },
  user: {
    type: ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true,
});

export default mongoose.models.Relation ||
  mongoose.model('Relation', RelationSchema);