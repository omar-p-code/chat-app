import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { User, Chat } from './model.js';
import JWT from 'jsonwebtoken';
import { verifyToken } from './auth.js';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const logedinUsers = []; // Set to keep track of logged-in users
// You can use this set to manage logged-in users, e.g., for broadcasting messages or notifications

const allowedOrigins = ['http://localhost:3000', 'https://wholly-leading-parrot.ngrok-free.app', "https://yama-client.loca.lt", "https://chat-app-eight-tau-86.vercel.app"]

const app = express();

const server = http.createServer(app);


mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('DataBaseConnected'))
.catch(err => {
   console.log('Error connecting to MongoDB:', err.message);
   if (err.code === 11000) {
   return res.status(409).json({
      error: 'duplicate',
      message: 'الاسم مستخدم بالفعل، اختر اسم آخر'
   });
}})

const corsOptions = {
   origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true)
      }else {
         callback(new Error('Not Allowed by cors'))
      }
   },
   credentials: true
}

const io = new Server(server, {
   cors: corsOptions
});

app.use(cors(corsOptions));

app.use(express.json())

app.post('/user', async(req, res) => {
   try {
      const check = await User.findOne({ user: req.body.user })
      const token = JWT.sign(req.body,
         process.env.JWT_SECRET,
         {
            expiresIn: '7d'
         }
      );
      if (!check) {
         await User.create(req.body);
         const userData = {
            name: req.body.name,
            user: req.body.user,
            password: req.body.password
         }
         res.status(200).json({...userData, token});
      }else {
         check.name = req.body.name;
         await check.save();
         if (logedinUsers.includes(check.user)) {
            console.log('User already logged in:', check.user);
            return res.status(409).json({
               error: 'duplicate',
               message: 'User already exists, please login with another username'
            });
         }
         logedinUsers.push(check.user);
         console.log('User logged in:', check.user);

         console.log('check', { ...check._doc, name: req.body.name })
         const userData = {
            name: check.name,
            user: check.user,
            password: check.password
         }
         res.status(201).json({...userData, token})
      }
   }catch(err) {
      console.log('Error', err)
      res.status(500).json({ error: 'server_error',error_message: errs, message: 'حدث خطأ غير متوقع' });
   }
});

app.get('/user',verifyToken , async (req, res) => {
   // console.log(req.user, req.headers.authorization)
   try {
      const data = await User.findOne({ user: req.user.user });
      console.log("req", req.user)
      if (!data) {
         return res.status(200).json({user: false, message: 'User not found'});
      }
      res.status(200).json(data);
   }catch (err) {
      console.log("req", req.user);
      console.log(err)
      res.status(500).json({ error: err.message });
   }
})

app.get('/chat', verifyToken, async (req, res) => {
   try {
      const chats = await Chat.find();
      // console.log(chats)
      console.log('users', logedinUsers);
      res.status(200).json(chats);
   }catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
   }
});

io.on('connection', (socket) => {
   console.log('✅ User connected:', socket.id);
   console.log('socket', socket.id);

   socket.on('join', (user) => {
      io.emit('user-joined', user);
   });

   socket.on('leave', (user) => {
      console.log('User exited:', user.user);
      const index = logedinUsers.indexOf(user.user);
      if (index !== -1) {
         logedinUsers.splice(index, 1);
         console.log('User logged out:', user.user);
      } else {
         console.log('User not found in logged-in users:', user);
      }
      console.log('Current logged-in users:', logedinUsers);
      io.emit('user-leave', user);
   });

   socket.on('chat', (data) => {
      io.emit('chat', data); });

   socket.on('error', (err) => {
      console.error('Socket error:', err); 
   });

   socket.on('typing', (data) => {
      console.log('User typing:', data.user);
      socket.broadcast.emit('typing', data);
   })

   socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
   });
});


app.post('/chat', verifyToken, async (req, res) => {
   try {
      const chat = await Chat.create({
         user: req.user.user,
         message: req.body.message
      });

      res.status(201).json(chat);
   }catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
   }
});

app.post('/logout', verifyToken, (req, res) => {
   const user = req.user.user;
   const index = logedinUsers.indexOf(user);
   if (index !== -1) {
      logedinUsers.splice(index, 1);
      console.log('User logged out:', user);
      res.status(200).json({ message: 'Logout successful' });
   } else {
      console.log('User not found in logged-in users:', user);
      res.status(404).json({ message: 'User not found' });
   }
});

server.listen('8080', () => {
   console.log('port 8080')
})