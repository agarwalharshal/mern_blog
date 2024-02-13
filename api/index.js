const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UserModel = require("./models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
const Post = require("./models/post");

const app = express();

const salt = bcrypt.genSaltSync(10);
const secret = "njadbwysckwjgr";

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json()); //middleware that allows us to read json from the request body
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

mongoose.connect(
	"mongodb+srv://blog:1L8GJ7peKnQY8qq3@cluster0.ht2klup.mongodb.net/?retryWrites=true&w=majority"
);

app.post("/register", async (req, res) => {
	const { username, password } = req.body; //destructuring
	try {
		const userDoc = await UserModel.create({
			username,
			password: bcrypt.hashSync(password, salt),
		});
		res.json(userDoc);
	} catch (error) {
		console.log(error);
		res.status(400).json(error);
	}
});

app.post("/login", async (req, res) => {
	const { username, password } = req.body;
	const userDoc = await UserModel.findOne({ username });
	const passOk = bcrypt.compareSync(password, userDoc.password);
	if (passOk) {
		//logged in
		jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
			if (err) throw err;
			res.cookie("token", token).json({
				id: userDoc._id,
				username,
			});
		});
		//res.json()
	} else res.status(400).json("wrong credentials");
});

app.get("/profile", (req, res) => {
	// console.log(req.cookies);
	const { token } = req.cookies;
	jwt.verify(token, secret, {}, (err, info) => {
		//info is the payload
		if (err) throw err;
		res.json(info); // iat: issued at (when the token was created)
	});
});

app.post("/logout", (req, res) => {
	// res.clearCookie("token").json("ok");
	res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
	const { originalname, path } = req.file;
	const parts = originalname.split(".");
	const ext = parts[parts.length - 1];
	const newPath = path + "." + ext;
	fs.renameSync(path, newPath);

	const { token } = req.cookies;
	jwt.verify(token, secret, {}, async (err, info) => {
		if (err) throw err;
		const { title, summary, content } = req.body;
		const postDoc = await Post.create({
			title,
			summary,
			content,
			cover: newPath,
			author: info.id,
		});
		res.json(postDoc);
	});
});

app.get("/post", async (req, res) => {
	res.json(
		await Post.find()
			.populate("author", ["username"])
			.sort({ createdAt: -1 })
			.limit(20)
	);
});

app.put("/post/:id", uploadMiddleware.single("file"), async (req, res) => {
	let newPath = null;
	if (req.file) {
		const { originalname, path } = req.file;
		const parts = originalname.split(".");
		const ext = parts[parts.length - 1];
		newPath = path + "." + ext;
		fs.renameSync(path, newPath);
	}

	const { token } = req.cookies;
	jwt.verify(token, secret, {}, async (err, info) => {
		if (err) throw err;
		const { id, title, summary, content } = req.body;
		const postDoc = await Post.findById(id);
		const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
		if (!isAuthor) {
			return res.status(400).json("you are not the author");
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

app.get("/post/:id", async (req, res) => {
	const { id } = req.params;
	res.json(await Post.findById(id).populate("author", ["username"]));
});

app.listen(4000);

//mongodb+srv://blog:1L8GJ7peKnQY8qq3@cluster0.ht2klup.mongodb.net/?retryWrites=true&w=majority
