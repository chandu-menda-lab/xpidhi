import Relation from '../../models/Relation';
import User from '../../models/User';
import FamilyTree from '../../models/FamilyTree';
import connectDb from '../../utils/connectDb';
import jwt from 'jsonwebtoken';
import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';
import { Mongoose } from 'mongoose';

connectDb();

export default async (req, res) => {
  switch (req.method) {
    case 'GET':
      await handleGetRequest(req, res);
      break;
    case 'POST':
      await handlePostRequest(req, res);
      break;
    default:
      res.status(405).send(`Method ${req.method} not allowed`);
  }
};

async function handlePostRequest(req, res) {
  if (!('authorization' in req.headers)) {
    return res.status(401).send('No authorization token');
  }
  const {
    firstName,
    lastName,
    email,
    relationType,
    selectedLevel,
    selectedNodeId,
  } = req.body;

  try {
    // 1) Get the logged user details
    const { userId } = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );

    const user = await User.findOne({
      _id: userId,
    });
    const { treeCode } = user;
    let parents = [];

    if (!user) {
      res.status(404).send('User not found');
    } else {
      const selectNodeTreeDetails = await FamilyTree.findOne({
        _id: selectedNodeId,
      });

      // 2) Create user relation
      //const newUserRelation = createRelation(req.body, user);
      const newUserRelation = await new Relation({
        firstName,
        lastName,
        email,
        user,
      }).save();

      //console.log(newUserRelation);
      // 3) Get user tree and update the details
      let level = selectedLevel;
      let newRelationFamilyTree;
      if (relationType === 'parents') {
        level = selectedLevel + 1;
        // let selectedUserParents = selectNodeTreeDetails.parents;
        
        // if(selectedUserParents.length == 0) {
        //   let parents = 
        // }

         newRelationFamilyTree = await new FamilyTree({
          treeCode,
          name: firstName,
          level: level,
          root: false,
          relation: newUserRelation,
          childrens: [selectedNodeId],
        }).save();
      } else if (relationType === 'childrens') {
        level = selectedLevel - 1;
         newRelationFamilyTree = await new FamilyTree({
          treeCode,
          name: firstName,
          level: level,
          root: false,
          relation: newUserRelation,
          parents: [selectedNodeId],
        }).save();
      } else if (relationType === 'siblings') {
        let selectedUserParents = selectNodeTreeDetails.parents;
        
        if(selectedUserParents.length == 2) {
          parents = selectNodeTreeDetails.parents;
        } else {
          let parentLevel = level + 1;
          const newParent1Relation = await new Relation({
            firstName: "firstName",
            lastName: "lastName",
            email: "parent1@gmail.com",
            user,
          }).save();

          const newParent1FamilyTree = await new FamilyTree({
            treeCode,
            name: firstName,
            level: parentLevel,
            root: false,
            relation: newParent1Relation,
            siblings: [selectedNodeId]
          }).save();

          if(selectedUserParents.length == 0) {
            const newParent2Relation = await new Relation({
              firstName: "firstName",
              lastName: "lastName",
              email: "parent2@gmail.com",
              user,
            }).save();
  
            const newParent2FamilyTree = await new FamilyTree({
              treeCode,
              name: "firstName",
              level: parentLevel,
              root: false,
              relation: newParent2Relation,
              siblings: [selectedNodeId]
            }).save();

            parents.push(newParent1FamilyTree._id, newParent2FamilyTree._id);
          } else if(selectedUserParents.length == 1) {
            parents.push(selectedUserParents[0]._id, newParent2Relation._id);
          }
        }

        newRelationFamilyTree = await new FamilyTree({
          treeCode,
          name: firstName,
          level: level,
          root: false,
          relation: newUserRelation,
          siblings: [selectedNodeId],
          parents: parents
        }).save();
      } else if (relationType === 'partners') {
        const newKidRelation = await new Relation({
          firstName: "kid firstname",
          lastName: "kid lastName",
          email: "kid@gmail.com",
          user,
        }).save();
  
        console.log(newKidRelation);

        newRelationFamilyTree = await new FamilyTree({
          treeCode,
          name: firstName,
          level: level,
          root: false,
          relation: newUserRelation,
          partners: [selectedNodeId]
        }).save();

        console.log(newRelationFamilyTree);

        const newKidRelationFamilyTree = await new FamilyTree({
          treeCode,
          name: "kid firstname",
          level: level-1,
          root: false,
          relation: newKidRelation,
          parents: [selectedNodeId, newRelationFamilyTree._id],
          childrens:[newKidRelation]
        }).save();

        console.log(newKidRelationFamilyTree);
      }

      const userFamilyTree = await FamilyTree.findOne({
        treeCode: treeCode,
        _id: selectedNodeId,
      });
      //console.log(userFamilyTree);
      if(relationType === "siblings" && parents.length > 0) {
        await FamilyTree.findOneAndUpdate(
          {
            _id: userFamilyTree._id,
          },
          {
            $addToSet: { [relationType]: newRelationFamilyTree, parents: parents },
          }
        );
      } else {
        await FamilyTree.findOneAndUpdate(
          {
            _id: userFamilyTree._id,
          },
          {
            $addToSet: { [relationType]: newRelationFamilyTree },
          }
        );
      }
      

      //@Todo have to update the relation in new Object

      res.status(200).json(newUserRelation);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error signup user. Please try again.');
  }
}

async function createRelation(requestData, user) {
  const {
    firstName,
    lastName,
    email,
    relationType,
    selectedLevel,
    selectedNodeId,
  } = requestData;
  return await new Relation({
    firstName,
    lastName,
    email,
    user,
  }).save();
}
