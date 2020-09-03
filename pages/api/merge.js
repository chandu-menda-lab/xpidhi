import Relation from '../../models/Relation';
import User from '../../models/User';
import FamilyTree from '../../models/FamilyTree';
import connectDb from '../../utils/connectDb';
import jwt from 'jsonwebtoken';
import { Mongoose } from 'mongoose';
import shortid from 'shortid';

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
    console.log(req.body);
    const {
      sourceTreecode,
      targetTreecode,
      sourceTreeId,
      targetTreeId,
      currentUserId
    } = req.body;

    try{
        const sourceTreeDetails = await FamilyTree.findOne({
            treeCode: sourceTreecode,
            root: true
        });

        const targetTreeDetails = await FamilyTree.findOne({
            treeCode: targetTreecode,
            root: true
        });

        // const tempTargetTreeDetails = await FamilyTree.findOne({
        //   _id: targetTreeId
        // });
        
        // Generate new tree code
        const newTreeCode = shortid.generate();
        console.log(newTreeCode);
        console.log(sourceTreeDetails);
        console.log(targetTreeDetails);
        //console.log(tempTargetTreeDetails);

        // Get tree details from both users
        if(targetTreeDetails.siblings.length > 0) {
          console.log("Source tree details");
          const updatedSourceTreeDetails = await FamilyTree.findOneAndUpdate({
              treeCode: sourceTreecode,
              root: true
          }, {
              $addToSet: { siblings: targetTreeDetails.siblings, parents: targetTreeDetails.parents },
          });
        }

        if(sourceTreeDetails.siblings.length > 0) {
          console.log("Target tree details");
          const updatedTargetTreeDetails = await FamilyTree.findOneAndUpdate({
              treeCode: targetTreecode,
              root: true
          }, {
              $addToSet: { siblings: [sourceTreeDetails._id], parents: sourceTreeDetails.parents },
          });

          await FamilyTree.findOneAndDelete({ _id: targetTreeId });
        }

        await FamilyTree.updateMany({
          treeCode: sourceTreecode
        }, {
            $set: { treeCode: newTreeCode },
        });
        
        await FamilyTree.updateMany({
          treeCode: targetTreecode
        }, {
            $set: { treeCode: newTreeCode },
        });

        await User.update({
          _id: sourceTreeDetails.user
        }, {
          $set: { treeCode: newTreeCode },
        });

        await User.update({
          _id: targetTreeDetails.user
        }, {
          $set: { treeCode: newTreeCode },
        });

        // need to check the sibilings and remove temp sibling from 
        // check relationtype and get respective details

    } catch (error) {
    console.error(error);
    res.status(500).send('Error signup user. Please try again.');
  }
}