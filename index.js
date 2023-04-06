const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
require('dotenv').config();
const PORT = process.env.PORT || 4500

console.log(process.env.NODE_ENV)
mongoose.connect('mongodb+srv://alexanderblanchardac:techblog123@cluster0.tw62k2s.mongodb.net/?retryWrites=true&w=majority')

var salt = bcrypt.genSaltSync(10);
const secret = 'asdghtredvbjmkkhyrr5689hggbnhgfd7';


app.use(cors({credentials:true, origin:'http://localhost:3002'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));



app.post('/register', async (req, res) => {
  const {username, password} = req.body;
    try{
        const userDoc = await User.create({
             username, 
             password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch(e) {
        console.log(e);
        res.status(400).json(e);
    }
});

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    const passwordCorrect = bcrypt.compareSync(password, userDoc.password);
    if (passwordCorrect) {
         jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('Incorrect login information.');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok')
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if(req.file){
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
     newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
    }
    
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath ? newPath : '',
            author:info.id,
        });
        res.json(postDoc);
    });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length -1];
        newPathEdit = path+'.'+ext;
        fs.renameSync(path, newPath);
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('You can only edit posts of which you are the author.');
        }
        await postDoc.updateOne({
            title, 
            summary, 
            content,
            cover: newPath ? newPath : postDoc.cover,
        });
        res.json(postDoc);
    });
});

app.get('/post', async (req, res) => {
    res.json(await Post.find()
    .populate('author', ['username'])
    .sort({createdAt: -1})
    .limit(30)
    );
 });

 //app.delete('/post', async (req, res) => {
    //const {id} = req.params;
    //res.json(await Post.findByIdAndDelete(id))
    //)
 //}

 app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
 })


mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(process.env.PORT || PORT, () => console.log(`Server running on port ${PORT}`))
})


