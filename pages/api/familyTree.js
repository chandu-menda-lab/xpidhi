import Relation from '../../models/Relation';
import User from '../../models/User';
import FamilyTree from '../../models/FamilyTree';
import connectDb from '../../utils/connectDb';
import jwt from 'jsonwebtoken';
import {
    Mongoose
} from 'mongoose';

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

async function handleGetRequest(req, res) {
    //console.log(req.headers.authorization);
    if (!('authorization' in req.headers)) {
        return res.status(401).send('No authorization token');
    }

    try {
        // 1) Get the logged user details
        const {
            userId
        } = jwt.verify(
            req.headers.authorization,
            process.env.JWT_SECRET
        );
        //console.log("userId::" + userId);
        const user = await User.findOne({
            _id: userId,
        });
        const {
            treeCode
        } = user;

        if (!user) {
            res.status(404).send('User not found');
        } else {
            // 3) Get user tree and update the details
            const userFamilyTree = await FamilyTree.find({
                treeCode: treeCode,
            });

            //   console.log(userFamilyTree);

            res.status(200).json(userFamilyTree);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error signup user. Please try again.');
    }
}