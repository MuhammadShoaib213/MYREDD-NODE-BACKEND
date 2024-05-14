const router = require("express").Router();
const { Admin } = require("../models/admin");
const bcrypt = require("bcrypt");
const Joi = require("joi");
require('dotenv').config();
const jwt = require('jsonwebtoken')


router.post("/a", async (req, res) => {
	try {
		const admin = await Admin.findOne({email: req.body.email})
		if(!admin){
			return res.status(200).send({message: 'Admin not found', sucess: false})
		}
		const isMatch =  await bcrypt.compare(req.body.password, admin.password)
		if(!isMatch){
			return res.status(200).send({message: 'Invalid Email or Password', success: false})
		}
		// const token = jwt.sign({id: user._id}, process.env.JWTPRIVATEKEY, {expiresIn: '1d'})
		return res.status(200).send({message: 'Login success', success: true, token})
	} catch (error) {
		console.log(error)
		res.status(500).send({message: `Error in login Ctrl ${error.message}`})
	}
});

const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = router;