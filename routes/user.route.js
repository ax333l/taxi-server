require('dotenv').config();

const express = require('express'),
      router = express.Router();
      jwt = require('jsonwebtoken');
      bcrypt = require('bcrypt');
      saltRounds = 9;
      withAuth = require('../middleware');
      crypto = require('crypto');
      nodemailer = require('nodemailer');

      registerValidation = require('../validation/register.validation');
      loginValidation = require('../validation/login.validation')

// User Model
const fs = require('fs');
const directoryPath = __dirname

fs.readdir(directoryPath, function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  } 
  //listing all files using forEach
  files.forEach(function (file) {
      // Do whatever you want to do with the file
      console.log(file); 
  });
});
let userSchema = require('../models/User');
const Order = require('../models/Order');

const config = require('config')

const { permit, mapref, getMap, getUser, createPointAtUser, updatePointAtUser, deletemarker } = require('../mapdial')
  
// CREATE user
router.post('/', async (req, res) => {

      
    // to hash pass
    const salt = await bcrypt.genSalt(9);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new userSchema({
      id: req.body.id,
      name: req.body.name,
      password: hashedPassword,
      role: req.body.role,
      resetPasswordToken: ' '
    });

    try {
      await user.save();
      const accessToken = jwt.sign({ _id: user._id }, config.get("secret"));
      permit(undefined, user.id)
      return res.header('authorization', accessToken).json({ accessToken, user })
    }catch(err){
      console.log(err)
      res.status(500).send(err);
    }
});

setInterval(async () => {
  const order = await Order.find({})
  order.forEach(async e => {
    if(e.driver){
      if(e.driverComponent){
        updatePointAtUser({_id: e.driverComponent}, e.driver)
      }
      else{
        const data = await createPointAtUser({variables: {pinColor: 'white', title: 'Driver'}, for: [e.customer]}, e.driver)
        e.driverComponent = data.response._id.toString()
        try{
          e.save()
        }
        catch(e){
          console.log(e)
        }
      }
    }
  });
}, 10000)

router.get('/map', withAuth, async (req, res) => {
  const user = await userSchema.findById(req.user._id)
  const USER = await getUser(user.id)
  const map = await getMap()
  const resp = map.component.filter(e => e.private&&(e.for.includes(USER.name)||e.for.includes(USER._id.toString())))
  return res.status(200).send(resp)
})

router.post('/mapref', withAuth, async (req, res) => {
    const user = await userSchema.findById(req.user._id)
    const USER = await getUser(user.id)
    await mapref(USER._id.toString(), req.body.region || req.body.e)
    return res.status(200).send({status: true})
})

router.get('/order/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
  return res.status(200).send(order)
})

router.delete('/order/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
  await Order.findByIdAndDelete(req.params.id)
  await deletemarker(order.driverComponent)
  return res.status(200).send('deleted')
})

router.post('/order', withAuth, async (req, res) => {
  const user = await userSchema.findById(req.user._id)
  const USER = await getUser(user.id)
  req.body.customer = USER.name
  const order = new Order(req.body)
  try{
    await order.save()
    return res.status(200).send({status: false, message: 'created:)))))'})
  }
  catch(e){
    return res.status(400).send({status: false, message: e})
  }
})

router.post('/takeorder', withAuth, async (req,res) => {
  const user = await userSchema.findById(req.user._id)
  const USER = await getUser(user.id)
  let order = await Order.findById(req.body.id)
  order.driver = USER.name
  try{
    await order.save()
    return res.status(200).send({status: true})
  }
  catch(e){
    return res.status(400).send({status: false})
  }
})

router.get('/myorders', withAuth, async (req, res) => {
  const USER = await getUser(user.id)
  const result = await Order.find({customer: USER._id.toString()})
  return res.status(200).send(result)
})

router.get('/orders', withAuth, async (req, res) => {
  const result = await Order.find({driver: null})
  return res.status(200).send(result)
})

router.get('/exists/:id', async (req, res) => {
    const user = await userSchema.findOne({id: req.params.id});
    if(user){
      return res.send({status: true})
    }
    return res.status(404).send({status: false})
})

// LOGIN users
router.post('/login', async (req, res) => {
  // validation of written data by user
  
  // check if there is such user in db
  const user = await userSchema.findOne({id: req.body.id});
  if ( user == null ) {
    return res.status(400).send("Cannot find a user.")
  }
  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      // token
      const accessToken = jwt.sign({ _id: user._id }, config.get("secret"));
      return res.header('authorization', accessToken).json({ accessToken, user })
    } else {
      return res.send("Credentials are not correct.")
    }
  } catch(e) {
    console.log(e)
    return res.status(500).send({status: false, message: JSON.stringify(e)});
  }
});

// READ users
router.get('/', (req, res) => {
  userSchema.find((error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})


// UPDATE user password
router.put('/:id', withAuth, (req, res, next) => {
  userSchema.findById({ _id: req.params.id }, async (err, userSchema) => {

    if (!userSchema) {
      res.status(404).send("There is no user with such id.");
    }

    try {
      if (await bcrypt.compare(req.body.oldPassword, userSchema.password)) {

        const salt = await bcrypt.genSalt(9);
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

        userSchema.password = hashedPassword;
        userSchema.save();
        res.json('userSchema updated!');
        // token
        // const accessToken = jwt.sign({ _id: userSchema._id }, process.env.ACCESS_TOKEN_SECRET);
        // res.header('authorization', accessToken).json({ accessToken, user })
      } else {
        res.send("Old password is not correct.")
      }

    } catch(err) {
      res.status(500).send(err);
    }
  })
});


// DELETE user
router.delete('/:id', (req, res, next) => {
  userSchema.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.status(200).json({
        msg: data
      })
    }
  })
})

module.exports = router;
