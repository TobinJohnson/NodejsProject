const fs = require('fs')
const path = require('path')
const { log, error } = require('console')
const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
const bodyParser=require('body-parser')
const createError=require('http-errors')
require('dotenv').config()
app.use(bodyParser.json())
const {
  generateAccessToken,
  generateRefreshToken,
  authenticateUser,
  verifyRefreshToken,
  generateUniqueId,
  // generateUniqueId,
} = require('../helpers/jwt')
const {loginCheckSchema}=require("../helpers/validation-schema")
const Joi = require('@hapi/joi')
const createHttpError = require('http-errors')
app.use(express.json)
app.use(express.urlencoded({extended:true}))

const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/userData.json')),
)


exports.loginGet = async (req, res) => {
  res.status(200).send(`You are now Admin Login page , now you can login`)
}

exports.login = async(req, res,next) => {
  try {
    console.log(req.body.email+"body")
    const { email, password } = req.body
    console.log(email+"email in exports")
    console.log(password+"password")  

    const UserDetails = authenticateUser(email, password)
    if (!UserDetails) 
      return res.status(401).send('Invalid email or password')
    console.log(UserDetails.email+"userDetails");
    const user = loginCheckSchema.validateAsync(req.body)
    // const user = await loginCheckSchema.validateAsync(UserDetails)
    console.log(user+"user");
    if (!user) 
      return res.status(401).send('Enter the email & password properly')

    if (UserDetails.role !== 'admin') 
      return res.status(403).send('Unauthorized User')
       const accessToken = await generateAccessToken(UserDetails.id)
      console.log(accessToken);
       const refresherToken= await generateRefreshToken(UserDetails.id)
       console.log(refresherToken+"refresherToken")
       res.status(200).send({accessToken,refresherToken})

  } catch(error) {
    if(error.isJoi===true) {
      return next(createError.BadRequest('Invalid Username/Password'))
    }
    next(error)
  }
}

exports.verifyRefreshToken = async (req, res,next) => {
  try {

  const { refresherToken } = req.body
  console.log(refresherToken+"refresh")
  if (!refresherToken)
    //  return res.status(401).send('Please provide a refresher token')
  throw createError.BadRequest("Provide refrsher token")
  const userId = await verifyRefreshToken(refresherToken)
  if (!userId)
    throw createError.BadRequest("Provide correct refresher token")
    // return res.status(403).send('Invalid refresher token')
 
    
      const accesstoken=await generateAccessToken(userId)
      const refreshTokenNew=await generateRefreshToken(userId)
      console.log(accesstoken+"access "+refreshTokenNew+"refresh");
      // res.json({accesstoken,refreshTokenNew})
      res.send({accesstoken,refreshTokenNew})
    
  } catch (error) {
    next(error)
  }


  // const userId = verifyRefreshToken(refresherToken)
  // if (!userId) return res.status(403).send('Invalid refresher token')
  // const accessToken = generateAccessToken(userId)
  // res.json({ accessToken })
}

exports.home = async (req, res) => {
  res.status(200).send('Welcome to the Home page')
}

exports.viewUsers = async (req, res) => {
  try {
    console.log('Hello')
    res.status(200).send(users)
  } catch (error) {
    res.status(500).send(error)
  }
}

exports.addUser = (req, res) => {
  try {
    const { name, number, role, email, password } = req.body
    if (!name || !number || !role || !email || !password)
      return res.status(400).send('Please fill all the fields')
    const user = {
      // id: users.length + 1,
      id: generateUniqueId(),
      name,
      number,
      role,
      email,
      password,
    }
    users.push(user)
    fs.writeFileSync(
      path.join(__dirname, '../data/userData.json'),
      JSON.stringify(users, null, 2),
    )
    res
      .status(201)
      .send(
        'User added successfully and the new UserDetails is ' +
          JSON.stringify(user),
      )
  } catch (error) {
    res.status(500).send(error)
  }
}

exports.editUsers = async (req, res) => {
  try {
    const userId = req.params.id
    const userIndex = users.findIndex((user) => user.id === userId)
    if (userIndex === -1) return res.status(404).send('Invalid user')
    if (req.body.name) users[userIndex].name = req.body.name
    if (req.body.number) users[userIndex].number = req.body.number
    if (req.body.role) users[userIndex].role = req.body.role
    if (req.body.email) users[userIndex].email = req.body.email
    if (req.body.password) users[userIndex].password = req.body.password

    fs.writeFileSync(
      path.join(__dirname, '../data/userData.json'),
      JSON.stringify(users, null, 2),
    )

    res.status(200).send({message:'User data successfully updated ' ,users:users})
  } catch (error) {
    res.status(500).send(error)
  }
}

exports.changePassword = async (req, res) => {
  const userId = req.params.id
  console.log(userId);
  try {
    const userIndex = users.findIndex((user) => user.id === userId)
    if (userIndex === -1) return res.status(404).send('Invalid user')
    if (req.body.password) users[userIndex].password = req.body.password
    console.log(users[userIndex].password+"like");
    fs.writeFileSync(
      path.join(__dirname, '../data/userData.json'),
      JSON.stringify(users, null, 2),
    )
    res
      .status(200)
      .send('User data successfully updated ' + JSON.stringify(users))
  } catch (error) {
    res.status(500).send(error)
  }
}

exports.userDelete = async (req, res) => {
  const userId = req.params.id
  try {
    const userIndex = users.findIndex((user) => user.id === userId)
    if (userIndex === -1) return res.status(404).send('Invalid user')
    users.splice(userIndex, 1)
    fs.writeFileSync(
      path.join(__dirname, '../data/userData.json'),
      JSON.stringify(users, null, 2),
    )
    res
      .status(200)
      .send(
        'User successfully deleted and the updated users list is ' +
          JSON.stringify(users),
      )
  } catch (error) {
    res.status(500).send(error)
  }
}

exports.PhotoUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Photo not uploaded')
    res.status(200).send ("Photo uploaded ")
  } catch(error) {
    console.log(error);
    res.status(500)
  }
}
