import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET; // يفضل في .env


// ميدل وير لحماية الراوتات
export function verifyToken(req, res, next) {
   const token = req.headers.authorization?.split(" ")[1].replaceAll('"', ''); // Expecting: Bearer <token>
   // console.log(JWT_SECRET)
   // console.log(token)

   if (!token) {
      return res.status(401).json({ message: 'Access Denied. Token missing.' });
   }

   try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // تقدر تستخدم req.user في الراوت بعد كده
      next();
   } catch (err) {
      // console.log(err)
      return res.status(403).json({ message: 'Invalid or expired token.' });
   }
}
