import jwtGenerator from '../util/jwtGenerator';
import { Router } from 'express';
import { verify } from '../util/scryptFunctions';
import pool from "../db";
import checkEmail from '../util/checkEmail';
import validation from "../middleware/validation";

const router = Router();


router.post("/auth", validation, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
            email,
        ]);

        if (user.rows.length === 0) {
            return res.status(401).json("Incorrect password or email. Please recheck & retry.");
        }

        const validPassword = await verify(password, user.rows[0].user_password);

        if (!validPassword) {
            return res.status(401).json("Incorrect password or email. Please recheck & retry.");
        }

        checkEmail("afe6510d-836e-4b14-8831-f10c6034e51a");

        const token = jwtGenerator(user.rows[0].user_id);

        res.cookie("token", token, {httpOnly: true});
        res.json({ token });

    } catch (err) {
        const error = <Error>err;
        console.error(error, error.message);
        res.status(500).send("Something went wrong from our end. We promise to fix it soon.");
    }

});

export default router;
