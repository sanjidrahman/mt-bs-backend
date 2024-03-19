const multer = require('multer')
const path = require('path')

// Multer for file storing
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'), function (err) {
            if (err) {
                throw err
            }
        });
    },

    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name, function (err) {
            if (err) {
                throw err
            }
        });
    }
});

const upload = multer({ storage: storage })

module.exports = upload