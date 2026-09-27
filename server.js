
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_PATH || "naruto.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL UNIQUE,
 protocol TEXT NOT NULL,
 traffic_limit INTEGER DEFAULT 50,
 traffic_used REAL DEFAULT 0,
 expires TEXT,
 status TEXT DEFAULT 'active',
 devices INTEGER DEFAULT 1,
 sub_token TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS configs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 protocol TEXT NOT NULL,
 port INTEGER DEFAULT 443,
 network TEXT DEFAULT 'TCP',
 status TEXT DEFAULT 'active'
);
`);

const count=db.prepare("SELECT COUNT(*) c FROM users").get().c;
if(!count){
  const ins=db.prepare("INSERT INTO users(username,protocol,traffic_limit,traffic_used,expires,status,devices,sub_token) VALUES(?,?,?,?,?,?,?,?)");
  ins.run("Uzumaki Naruto","VLESS",50,12.4,"2026-10-30","active",2,"NAR-001");
  ins.run("Sasuke Uchiha","VMess",100,8.7,"2026-11-12","active",2,"NAR-002");
  ins.run("Sakura Haruno","Trojan",50,5.2,"2026-10-25","offline",1,"NAR-003");
  ins.run("Kakashi Hatake","Reality",200,21.3,"2026-11-05","active",2,"NAR-004");
}
const cc=db.prepare("SELECT COUNT(*) c FROM configs").get().c;
if(!cc){
  const ins=db.prepare("INSERT INTO configs(name,protocol,port,network,status) VALUES(?,?,?,?,?)");
  ins.run("VLESS-WS","VLESS",443,"WS","active");
  ins.run("VMess-gRPC","VMess",443,"gRPC","active");
  ins.run("Trojan-TCP","Trojan",443,"TCP","active");
  ins.run("Reality-RT","Reality",443,"TCP","active");
}

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/stats",(req,res)=>{
 const users=db.prepare("SELECT COUNT(*) c FROM users").get().c;
 const online=db.prepare("SELECT COUNT(*) c FROM users WHERE status='active'").get().c;
 const configs=db.prepare("SELECT COUNT(*) c FROM configs WHERE status='active'").get().c;
 const traffic=db.prepare("SELECT COALESCE(SUM(traffic_used),0) t FROM users").get().t;
 res.json({users,online,configs,traffic:Number(traffic).toFixed(1)});
});
app.get("/api/users",(req,res)=>res.json(db.prepare("SELECT * FROM users ORDER BY id DESC").all()));
app.post("/api/users",(req,res)=>{
 const {username,protocol="VLESS",traffic_limit=50,expires,devices=1}=req.body;
 if(!username||!expires) return res.status(400).json({error:"username and expires are required"});
 const token="NAR-"+Math.random().toString(36).slice(2,8).toUpperCase();
 try{
  const r=db.prepare("INSERT INTO users(username,protocol,traffic_limit,expires,devices,sub_token) VALUES(?,?,?,?,?,?)").run(username,protocol,Number(traffic_limit),expires,Number(devices),token);
  res.json(db.prepare("SELECT * FROM users WHERE id=?").get(r.lastInsertRowid));
 }catch(e){res.status(409).json({error:"Username already exists"});}
});
app.delete("/api/users/:id",(req,res)=>{
 db.prepare("DELETE FROM users WHERE id=?").run(req.params.id); res.json({ok:true});
});
app.get("/api/configs",(req,res)=>res.json(db.prepare("SELECT * FROM configs ORDER BY id DESC").all()));
app.post("/api/configs",(req,res)=>{
 const {name,protocol="VLESS",port=443,network="TCP"}=req.body;
 if(!name)return res.status(400).json({error:"name is required"});
 const r=db.prepare("INSERT INTO configs(name,protocol,port,network) VALUES(?,?,?,?)").run(name,protocol,Number(port),network);
 res.json(db.prepare("SELECT * FROM configs WHERE id=?").get(r.lastInsertRowid));
});
app.get("/api/sub/:token",(req,res)=>{
 const u=db.prepare("SELECT * FROM users WHERE sub_token=?").get(req.params.token);
 if(!u)return res.status(404).json({error:"Subscription not found"});
 res.json({name:u.username,protocol:u.protocol,expires:u.expires,traffic:`${u.traffic_used}/${u.traffic_limit} GB`,url:`${req.protocol}://${req.get("host")}/sub/${u.sub_token}`});
});
app.get("/sub/:token",(req,res)=>{
 const u=db.prepare("SELECT * FROM users WHERE sub_token=?").get(req.params.token);
 if(!u)return res.status(404).send("Subscription not found");
 res.type("text/plain").send(`# Naruto Subscription
user=${u.username}
protocol=${u.protocol}
traffic=${u.traffic_used}/${u.traffic_limit}GB
expires=${u.expires}
`);
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Naruto Panel running on ${PORT}`));
