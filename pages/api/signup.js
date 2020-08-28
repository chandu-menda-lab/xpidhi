import Relation from '../../models/Relation';
import User from '../../models/User';
import FamilyTree from '../../models/FamilyTree';
import connectDb from '../../utils/connectDb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import shortid from 'shortid';
import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';

connectDb();

export default async (req, res) => {
  const {
    firstName,
    fatherName,
    motherName,
    lastName,
    email,
    password,
  } = req.body;
  const treeCode = shortid.generate();
  try {
    //Validations
    //if(!isLength(firstName, {min: 3, max: 10}))

    // 1) Check to see if the user already exists in the db
    const user = await User.findOne({
      email,
    });
    if (user) {
      return res.status(422).send(`User already exist with email ${email}`);
    }
    // 2) -- if not, hash their password
    const hash = await bcrypt.hash(password, 10);
    // 3) create user
    const newUser = await new User({
      firstName,
      fatherName,
      motherName,
      lastName,
      email,
      password: hash,
      treeCode: treeCode,
    }).save();

    console.log('New User');
    console.log({
      newUser,
    });

    try {
      // 2) Create user relation
      const newUserRelation = await new Relation({
        firstName,
        lastName,
        email,
        user: newUser,
      }).save();
      console.log('New Relation');
      console.log(newUserRelation);
      try {
        // 3) create user tree based on tree code
        const newFamilyTree = await new FamilyTree({
          treeCode,
          name: firstName,
          level: 0,
          root: true,
          relation: newUserRelation
        }).save();
        console.log('New Family tree');
        console.log(newFamilyTree);

        // 4) create token for the new user
        const token = jwt.sign({
            userId: newUser._id,
          },
          process.env.JWT_SECRET, {
            expiresIn: '7d',
          }
        );
        // 5) send back token
        res.status(201).json(token);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error creating family tree. Please try again.');
      }

    } catch (error) {
      console.error(error);
      res.status(500).send('Error relation. Please try again.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error signup user. Please try again.');
  }
};