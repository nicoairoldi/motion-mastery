const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../user/userSchema");
const config = require("../config/loginConfig");

/**
 * Creates a new user account. Password is hashed with bcrypt before it ever
 * touches the database — the plaintext password is never stored.
 *
 * The `name` field is optional (username, email, and password are required),
 * so we branch on whether it was provided in the request body.
 *
 * Responses:
 *   201 { created: true }                 — account created
 *   403 { created: false, message }       — email already exists (Mongo
 *                                            duplicate key error code 11000)
 *   409 { created: false, message }       — validation failed for another
 *                                            reason (e.g. password too short)
 */
async function createAccount(req, res, next) {
	var name;
	var email = req.body.email;
	var pass = req.body.pass;
	var username = req.body.user;
	var has_name = false;
	console.log(email);
	const hashed_password = bcrypt.hashSync(pass, 10);
	// console.log(hashed_password);

	if (req.body.hasOwnProperty("name")) {
		has_name = true;
		name = req.body.name;
	}

	try {
		var new_user;
		if (has_name) {
			new_user = new User({
				name: name,
				email: email,
				password: hashed_password,
				username: username,
			});
		} else {
			new_user = new User({
				email: email,
				password: hashed_password,
				username: username,
			});
		}

		await new_user.save();
		res.status(201).send({ created: true });
	} catch (error) {
		console.log("new signup failed");
		//console.log(`the error is ${error}`);
		if (error.code == 11000) {
			res.status(403).send({
				created: false,
				message: "Email already exists! try logging in",
			});
		} else {
			res.status(409).send({ created: false, message: error.message });
		}
	}
}

/**
 * Signs an existing user in and hands them two tokens:
 *
 *   1. An access token (JWT) — expires in 90 seconds. Sent back in the JSON
 *      response so the frontend can hold it in memory and attach it to every
 *      protected request as "Authorization: Bearer <token>". Kept short so
 *      that if it's ever leaked, the window of abuse is small.
 *
 *   2. A refresh token (JWT) — expires in 1 day. Stored in an httpOnly cookie
 *      so JavaScript on the page can NOT read it (protects against XSS token
 *      theft). We also persist it on the user document so we can validate
 *      that a refresh request is using a token we actually issued.
 *
 * Responses:
 *   200 { accessToken, message }  — logged in
 *   401 { message }               — wrong password or no user with that email
 */
async function signIn(req, res, next) {
	var email = req.body.email;
	var pass = req.body.pass;
	//console.log("in signIn");
	//console.log(email);

	try {
		const user = await User.findOne({ email: email });

		if (user) {
			const passCompare = await bcrypt.compare(pass, user.password);

			if (passCompare) {
				console.log(user._id);
				var accessToken = jwt.sign(
					{ id: user._id },
					process.env.jwtSecret,
					{
						expiresIn: "90s",
					},
				);
				var refreshToken = jwt.sign(
					{ id: user._id },
					process.env.refreshSecret,
					{ expiresIn: "1d" },
				);
				user.refreshToken = refreshToken;
				await user.save();
				//const hashed_token = bcrypt.hashSync(token, 10);
				// 24 * 60 * 60 * 1000 is one day because its in mili seconds
				//console.log("Before setting cookie");
				res.clearCookie("JWT_TOKEN");
				//res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
				res.cookie("JWT_TOKEN", refreshToken, {
					secure: true,
					httpOnly: true,
					maxAge: 24 * 60 * 60 * 1000,
				});
				//console.log("After setting cookie");
				res.json({
					accessToken: accessToken,
					message: `success ${user.username} is logged in`,
				});
			} else {
				res.status(401).json({ message: "password was not a match" });
				next();
			}
		} else {
			res.status(401).json({ message: "no user with that email exists" });
			next();
		}
	} catch (e) {
		res.status(401).send(e.message);
	}
}

async function DeleteUser(req, res, next) {
	const user = res.locals.user;
	try {
		const deleteUser = await User.deleteOne({ _id: user });
		res.send({ deleted: true, count: deleteUser });
	} catch (e) {
		res.send({ message: e.message });
	}
}

module.exports = {
	createAccount: createAccount,
	signIn: signIn,
	DeleteUser: DeleteUser,
};
