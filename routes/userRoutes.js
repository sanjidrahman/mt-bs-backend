const route = require('express')();
const userController = require('../controllers/userControllers')
const upload = require('../middleware/multer')
const auth = require('../middleware/auth')

route.get('/', (req, res) => {
    res.send('Hi from Server..!')
})

route.post('/signin', userController.signin);
route.post('/signup', userController.signup);

route.post('/products', upload.single('image'), userController.addProduct);
route.get('/products', userController.getProducts);
route.post('/product-details', userController.getProductDetails);

route.get('/categories', userController.getCategories);

route.get('/cart', auth.auth, userController.getCart);
route.post('/cart', auth.auth, userController.addToCart);
route.delete('/cart', auth.auth, userController.deleteFromCart);
route.patch('/cart', auth.auth, userController.decrementCount);

module.exports = route;