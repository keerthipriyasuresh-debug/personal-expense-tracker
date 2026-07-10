import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool } from './db/connection.js';
import { initDB } from './db/init.js';
import { verifyToken } from './middleware/auth.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();


// =======================
// Middleware
// =======================

app.use(express.json());
app.use(cookieParser());


app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? true
        : "http://localhost:5173",
    credentials: true
}));


// =======================
// Serve React Frontend
// =======================

const clientPath = path.join(__dirname, "../dist");

app.use(express.static(clientPath));


// =======================
// Health Check
// =======================

app.get("/api/health", async (req,res)=>{

    res.json({
        status:"ok",
        message:"API running"
    });

});



// =======================
// AUTH REGISTER
// =======================

app.post("/api/auth/register", async(req,res)=>{

try{

const {name,email,password}=req.body;


if(!name || !email || !password)
{
return res.status(400).json({
error:"Missing fields"
});
}



const existing =
await pool.query(
"SELECT id FROM users WHERE email=$1",
[email]
);


if(existing.rows.length)
{
return res.status(409).json({
error:"Email already exists"
});
}



const hash =
await bcrypt.hash(password,10);



const result =
await pool.query(

`INSERT INTO users
(name,email,password,provider,verified)
VALUES($1,$2,$3,$4,$5)
RETURNING id,name,email,provider,avatar`,

[
name,
email,
hash,
"email",
true
]

);



const user=result.rows[0];



await pool.query(
"INSERT INTO income(user_id,amount) VALUES($1,$2) ON CONFLICT DO NOTHING",
[user.id,0]
);



const token =
jwt.sign(
{
id:user.id,
email:user.email
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);



res.cookie(
"token",
token,
{
httpOnly:true,
secure:process.env.NODE_ENV==="production",
sameSite:"lax"
}
);



res.json({
user
});


}
catch(err){

console.error(err);

res.status(500).json({
error:"Server error"
});

}

});



// =======================
// LOGIN
// =======================

app.post("/api/auth/login",async(req,res)=>{


try{


const {email,password}=req.body;


const result =
await pool.query(
"SELECT * FROM users WHERE email=$1",
[email]
);



if(!result.rows.length)
{
return res.status(401).json({
error:"Invalid login"
});
}



const user=result.rows[0];


if(!user.password)
{
return res.status(401).json({
error:"Use social login"
});
}



const match =
await bcrypt.compare(
password,
user.password
);



if(!match)
{
return res.status(401).json({
error:"Invalid password"
});
}



const token =
jwt.sign(
{
id:user.id,
email:user.email
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);



res.cookie(
"token",
token,
{
httpOnly:true,
secure:process.env.NODE_ENV==="production",
sameSite:"lax"
}
);



res.json({

user:{
id:user.id,
name:user.name,
email:user.email,
provider:user.provider,
avatar:user.avatar
}

});


}
catch(err){

console.error(err);

res.status(500).json({
error:"Server error"
});

}


});




// =======================
// SOCIAL LOGIN
// =======================

app.post("/api/auth/social",async(req,res)=>{


try{


const {
provider,
name,
email,
avatar
}=req.body;



if(!provider || !email)
{
return res.status(400).json({
error:"Invalid request"
});
}



let result =
await pool.query(
"SELECT * FROM users WHERE email=$1",
[email]
);



let user;



if(result.rows.length)
{

user=result.rows[0];

}
else
{


result =
await pool.query(

`INSERT INTO users
(name,email,password,provider,avatar,verified)
VALUES($1,$2,$3,$4,$5,$6)
RETURNING id,name,email,provider,avatar`,

[
name || "User",
email,
null,
provider,
avatar || null,
true
]

);


user=result.rows[0];


await pool.query(
"INSERT INTO income(user_id,amount) VALUES($1,$2) ON CONFLICT DO NOTHING",
[user.id,0]
);


}




const token =
jwt.sign(
{
id:user.id,
email:user.email
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);



res.cookie(
"token",
token,
{
httpOnly:true,
secure:process.env.NODE_ENV==="production",
sameSite:"lax"
}
);



res.json({
user
});


}
catch(err){

console.error(err);

res.status(500).json({
error:"Social login failed"
});

}


});




// =======================
// LOGOUT
// =======================

app.post("/api/auth/logout",(req,res)=>{


res.clearCookie("token");

res.json({
message:"Logged out"
});


});




// =======================
// CURRENT USER
// =======================

app.get(
"/api/auth/me",
verifyToken,
async(req,res)=>{


const result =
await pool.query(
"SELECT id,name,email,provider,avatar FROM users WHERE id=$1",
[req.user.id]
);



res.json({
user:result.rows[0]
});


});





// =======================
// EXPENSES
// =======================


app.get(
"/api/expenses",
verifyToken,
async(req,res)=>{


const result =
await pool.query(
"SELECT * FROM expenses WHERE user_id=$1 ORDER BY date DESC",
[req.user.id]
);



res.json({
expenses:result.rows
});


});




app.post(
"/api/expenses",
verifyToken,
async(req,res)=>{


const {
title,
amount,
category,
date,
notes
}=req.body;



const result =
await pool.query(

`INSERT INTO expenses
(user_id,title,amount,category,date,notes)
VALUES($1,$2,$3,$4,$5,$6)
RETURNING *`,

[
req.user.id,
title,
amount,
category,
date,
notes || ""
]

);



res.json({
expense:result.rows[0]
});


});




// =======================
// INCOME
// =======================


app.get(
"/api/income",
verifyToken,
async(req,res)=>{


const result =
await pool.query(
"SELECT amount FROM income WHERE user_id=$1",
[req.user.id]
);


res.json({
amount:
result.rows.length
?
result.rows[0].amount
:
0
});


});





// =======================
// React Router Support
// Express 5 compatible
// =======================

app.use((req,res)=>{

res.sendFile(
path.join(clientPath,"index.html")
);

});





// =======================
// Start Server
// =======================


async function start(){

await initDB();


const PORT =
process.env.PORT || 3001;



app.listen(
PORT,
()=>console.log(
`Server running on port ${PORT}`
)
);


}



start().catch(err=>{

console.error(
"Server failed:",
err
);

process.exit(1);

});