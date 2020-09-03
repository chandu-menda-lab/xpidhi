import mongoose, {
  isValidObjectId
} from 'mongoose';

const {
  String,
  ObjectId
} = mongoose.Schema.Types;

const FamilyTreeSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  treeCode: {
    type: String,
    required: true,
  },
  partners: [{
    type: ObjectId,
    ref: 'Relation',
  }, ],
  parents: [{
    type: ObjectId,
    ref: 'Relation',
  }, ],
  childrens: [{
    type: ObjectId,
    ref: 'Relation',
  }, ],
  siblings: [{
    type: ObjectId,
    ref: 'Relation',
  }, ],
  level: {
    type: Number,
    default: 0,
  },
  root: {
    type: Boolean,
    default: true,
  },
  className: {
    type: String,
  },
  relation: {
    type: ObjectId,
    ref: 'Relation'
  },
  user: {
    type: ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true,
});

export default mongoose.models.FamilyTree ||
  mongoose.model('FamilyTree', FamilyTreeSchema);