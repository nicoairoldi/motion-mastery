const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../user/userSchema");
const config = require("../config/loginConfig");


/**
 * Issues a new access token using the refresh token stored in the httpOnly
 * JWT_TOKEN cookie. This lets the frontend silently re-authenticate the user
 * whenever the short-lived access token expires, so they don't get bounced
 * back to the login page mid-session.
 *
 * Flow:
 *   1. Read the refresh token from the JWT_TOKEN cookie
 *   2. Look up the user by that refreshToken in the DB — this ensures the
 *      token was actually issued by us and hasn't been revoked
 *   3. Verify the refresh JWT signature against refreshSecret
 *   4. Sign and return a new short-lived access token
 *
 * Responses:
 *   200 { accessToken }  — success
 *   401                  — no cookie sent (or unexpected server error)
 *   403                  — token invalid, expired, or doesn't match the user
 */
async function handleRefreshToken(req, res, next) {
	//console.log("in handleRefreshToken");
	const cookies = req.cookies;
	if (!cookies?.JWT_TOKEN) return res.sendStatus(401);
	console.log(cookies.JWT_TOKEN);
	const refreshToken = cookies.JWT_TOKEN;

	try {
		const user = await User.findOne({ refreshToken: refreshToken });

		if (user) {
			/**console.log("found user in handleRT");
			console.log(`secret: ${process.env.jwtSecret}`);
			console.log(`refresh: ${refreshToken}}`); */
            jwt.verify(refreshToken, process.env.refreshSecret, (err, decoded) => {
				//console.log(`decoded: ${JSON.stringify(decoded)}`);
				//console.log(`user: ${JSON.stringify(user)}`);
				if (err || (user._id.toString() !== decoded.id.toString())) return res.status(403);
				const accessToken = jwt.sign({ id: user._id }, process.env.jwtSecret, {
					expiresIn: "120s",
				}); // play with then with new route from home page
				//console.log(`in handle refresh token: token=> ${accessToken}`);
				res.json({ accessToken });
			});
		} else {
			 res.sendStatus(403);
		}
	} catch (e) {
		res.sendStatus(401); 
	}
}

module.exports = {
	handleRefreshToken: handleRefreshToken,
};
