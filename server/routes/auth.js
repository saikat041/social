const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'My Secret';

const User = require('../models/User')
const {signupSchema, signinSchema} = require('../validation/validation')

router.post('/signup', async function(req, res, next){
    try{
        const {name, email, password} = req.body
        const {error} = signupSchema.validate({name, email, password})
    
        if(error){
            return res.status(400).send(error.details[0].message)
        }
    
        const user = new User({name, email, password: bcrypt.hashSync(password, salt)})
        const emailExists = await User.findOne({email})
        if (emailExists){
            return res.status(400).send("Email already exists");
        }
    
        const savedUser = await user.save();
        const token = jwt.sign({userId: savedUser._id}, JWT_SECRET, {expiresIn:'1m'});
        res.cookie('token', token);
        res.send(token);

    }catch(err){
        next(err)
    }

});

router.post('/signin', async function(req, res, next){
    try{
        const {email, password} = req.body
        const {error} = signinSchema.validate({email, password})
    
        if (error){
            return res.status(400).send(error.details[0].message)
        }
    
        const user = await User.findOne({email})
        // if user with given email is not present in the db
        if (!user){
            return res.status(400).send('Email or password is incorrect');
        }
    
        // comparing hashed password stored in the db with given password
        const passwordMatched = await bcrypt.compare(password, user.password)
        if (!passwordMatched){
            return res.status(400).send('Email or password is incorrect');
        }
        const token = jwt.sign({userId: user._id}, JWT_SECRET, {expiresIn:'30s'});
        res.cookie('token', token);
        res.send(token);

    }catch(err){
        return next(err)
    }

});

module.exports = router