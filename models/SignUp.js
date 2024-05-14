const router = require("express").Router();
const { Admin, validate } = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const admin = await Admin.findOne({ email: req.body.email });
		if (admin)
			return res
				.status(409)
				.send({ message: "Admin with given email already Exist!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		await new Admin({ ...req.body, password: hashPassword }).save();

		// const token = jwt.sign({email : result.email, id: result._id},JWTPRIVATEKEY );
		// res.status(201).json({admin: result, token: token});

		res.status(201).send({ message: "Admin created successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

module.exports = router;