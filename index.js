const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors({origin: "*"}));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Mongoose code

mongoose.connect("mongodb+srv://danrook33:Dannyboy@cluster0.e4erjno.mongodb.net/?retryWrites=true&w=majority");

const usernameSchema = new mongoose.Schema({
  username: {type: String, required: true}
});

const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String}
});

let username = mongoose.model('username', usernameSchema);
let exercise = mongoose.model('exercise', exerciseSchema);

// Express code

app.post("/api/users", async function(req, res) {
  let newUser = new username({username: req.body.username});
  await newUser.save();
  res.json({username: newUser.username, _id: newUser._id});
});

app.get("/api/users", async function(req, res) {
  let allUsers = await username.find({});
  res.send(allUsers);
});

app.post("/api/users/:_id/exercises", async function(req, res) {
  // So username can be extracted
  let user = await username.findById(req.params._id).exec();
  let newExercise = new exercise({
    user_id: user._id,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  });
  await newExercise.save();
  res.json({
    username: user.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString(),
    _id: user._id
  });
});

app.get("/api/users/:_id/logs", async function(req, res) {
  // So username can be extracted
  let user = await username.findOne({_id: req.params._id}).exec();
  let allExercises = await exercise.find({user_id: req.params._id})
  .select("description duration date -_id").exec();
  if (req.query.from) {
    let lowerLimit = new Date(req.query.from).getTime();
    allExercises = allExercises.filter(element => new Date(element.date).getTime() > lowerLimit);
  }
  if (req.query.to) {
    let upperLimit = new Date(req.query.to).getTime();
    allExercises = allExercises.filter(element => new Date(element.date).getTime() < upperLimit);
  }
  if (req.query.limit) {
    allExercises = allExercises.slice(0, req.query.limit);
  }
  res.json({
    username: user.username,
    count: allExercises.length,
    _id: user._id,
    log: allExercises
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
