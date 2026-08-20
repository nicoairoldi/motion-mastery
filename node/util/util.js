const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/loginConfig");
require("dotenv").config();

/**
 * Express middleware that guards every protected route. Verifies the caller
 * is holding a valid, unexpired access token before letting the request reach
 * the route handler.
 *
 * Expects an "Authorization: Bearer <token>" header (set on the frontend by
 * the axios interceptor in useAxiosPrivate). If the token is missing, we
 * return 401 so the frontend knows to send the user to login. If the token
 * is present but invalid or expired, we return 403 — the axios response
 * interceptor treats 403 as "try to refresh the token and retry once."
 *
 * On success, we attach the decoded user id to req.user so downstream
 * handlers know which user is making the request without re-parsing the JWT.
 */
function ValidateToken(req, res, next) {
	console.log("in validate token");
	//console.log(`jwtsecret: ${process.env.jwtSecret}`)
	//console.log(req.cookies.JWT_TOKEN);
	//console.log(JSON.stringify(req.headers));
	const authHeader = req.headers["authorization"];
	console.log("Authorization Header received:", JSON.stringify(authHeader));
	if (!authHeader) {
		return res.status(401).send({ message: "no token recieved" });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		return res.status(401).send({ message: "No token provided" });
	}

	// should have token here , time to verify
	jwt.verify(token, process.env.jwtSecret, (err, decoded) => {
		if (err) {
			console.log("failed jwt verification");
			return res
				.status(403)
				.send({ message: "this token is no longer valid" });
		}
		// by now the token is valid and we can attatch the user to the request
		//console.log(`decoded: ${JSON.stringify(decoded)}`);
		req.user = decoded.id; //  moved this to be added into the response object, unsure if we are allowed to add to the request object at this stage
		next();
	});
}
/**
 * makes sure all the needed keys are in the object
 * @param {*} object object in which we are looking for a specific property
 * @param {*} keys properties that will be looked for in the object
 */
function checkKeys(object, keys) {
	console.log("checkKeys");
	console.log(object);
	console.log("keys");
	console.log(keys);
	console.log(`[${Object.keys(object)}] v.s [${keys}]`);
	if (!object) {
		return false;
	}

	for (k in keys) {
		if (object.hasOwnProperty(keys[k])) {
			continue;
		} else {
			return false;
		}
	}
	return true;
}

/**
 * wrapper fn to call checkKeys to make sure all necessary keys are in the object or return an error message
 * @param {*} object object that we are checking for the right keys
 * @param {*} required_keys keys that should be in the object
 * @param {*} next express next call
 */
function verifyObject(object, required_keys, next) {
	if (checkKeys(object, required_keys) || required_keys == true) {
		// keys are vaild go to next function
		next();
	} else {
		// keys are missing , return error message
		next("missing required keys");
	}
}

module.exports = {
	ValidateToken: ValidateToken,
	verifyObject: verifyObject,
};
