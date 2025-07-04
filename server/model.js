import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
name: {
   type: String,
   required: true
},
user: {
   type: String,
   required: true,
   unique: true
},
password: {
   type: String,
   required: true
}
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


const chatSchema = new mongoose.Schema({
   user: {
      type: String,
      ref: 'User',
      required: true
   },
   message: {
      type: String,
      required: true
   }
})
const Chat = mongoose.model('Chat', chatSchema);
export {User, Chat};
