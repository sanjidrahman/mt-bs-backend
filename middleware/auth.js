const jwt = require('jsonwebtoken')

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        console.log('Hii');
        const authHeaders = req.headers.authorization;
        if (authHeaders && authHeaders.split(' ')[1]) {
            const token = authHeaders.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Not Authorization' })
            }

            const decoded = jwt.verify(token, 'usersecret');
            req.body.userId = decoded.payload.id;

            next();
        } else {
            res.status(401).json({ message: 'Not Authorization' })
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

module.exports = {
    auth
}