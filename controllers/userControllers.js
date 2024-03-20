const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// password hashing
const securepassword = async (password) => {
    try {
        const securepassword = await bcrypt.hash(password, 10)
        return securepassword
    } catch (err) {
        console.log(err.message);
    }
}

// Signin with adding localStorage's cart data
const signin = async (req, res) => {
    try {
        const { userdata, localCartData } = req.body
        const existingUser = await User.findOne({ email: userdata.email })

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found, Please register!' })
        }

        const encpass = await bcrypt.compare(userdata.password, existingUser.password)
        if (!encpass) {
            return res.status(401).json({ message: 'Email or Password incorrect' })
        }

        const payload = { id: existingUser._id, role: 'user' };
        const token = jwt.sign({ payload }, 'usersecret');

        // Adding cart datas from local storage to DB
        if (localCartData) {
            for (let item of localCartData) {
                const product = await Product.findOne({ _id: item.f_id })
                const cart = await Cart.findOne({ user: existingUser._id })

                if (cart) {
                    const existProductIndex = cart.products.findIndex(p => p.productId.toString() === item.f_id);
                    if (existProductIndex != -1) {
                        await Cart.findOneAndUpdate({ user: existingUser._id, 'products.productId': item.f_id },
                            {
                                $inc: {
                                    'products.$.quantity': 1,
                                    'products.$.totalPrice': item.quantity * product.price
                                }
                            })
                    } else {
                        const total = item.quantity * product.price
                        await Cart.findOneAndUpdate({ user: existingUser._id },
                            {
                                $push: {
                                    products: {
                                        productId: item.f_id,
                                        quantity: item.quantity,
                                        price: product.price,
                                        totalPrice: total
                                    }
                                }
                            }
                        )
                    }
                } else {
                    const total = item.quantity * product.price
                    const cartData = new Cart({
                        user: existingUser._id,
                        products: [{
                            productId: item.f_id,
                            quantity: item.quantity,
                            price: product.price,
                            totalPrice: total
                        }]
                    })
                    await cartData.save()
                }
            }
        }

        return res.status(200).json({ message: 'Success', token })

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Signup with adding localStorage's cart data
const signup = async (req, res) => {
    try {
        const { userdata, localCartData } = req.body
        const existingUser = await User.findOne({ email: userdata.email })

        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' })
        }

        if (userdata.password != userdata.cpassword) {
            return res.status(404).json({ message: `Password and confirm password doesn't match` })
        }

        const spassword = await securepassword(userdata.password)

        const newUser = await User.create({
            name: userdata.name,
            email: userdata.email,
            password: spassword,
        })
        const createdUser = await newUser.save()

        const payload = { id: createdUser._id, role: 'user' };
        const token = jwt.sign({ payload }, 'usersecret');

        // Adding cart datas from local storage to DB
        if (localCartData) {
            for (let item of localCartData) {
                const product = await Product.findOne({ _id: item.f_id })
                const cart = await Cart.findOne({ user: createdUser._id })

                if (cart) {
                    const existProductIndex = cart.products.findIndex(p => p.productId.toString() === item.f_id);
                    if (existProductIndex != -1) {
                        await Cart.findOneAndUpdate({ user: createdUser._id, 'products.productId': item.f_id },
                            {
                                $inc: {
                                    'products.$.quantity': 1,
                                    'products.$.totalPrice': item.quantity * product.price
                                }
                            })
                    } else {
                        const total = item.quantity * product.price
                        await Cart.findOneAndUpdate({ user: createdUser._id },
                            {
                                $push: {
                                    products: {
                                        productId: item.f_id,
                                        quantity: item.quantity,
                                        price: product.price,
                                        totalPrice: total
                                    }
                                }
                            }
                        )
                    }
                } else {
                    const total = item.quantity * product.price
                    const cartData = new Cart({
                        user: createdUser._id,
                        products: [{
                            productId: item.f_id,
                            quantity: item.quantity,
                            price: product.price,
                            totalPrice: total
                        }]
                    })
                    await cartData.save()
                }
            }
        }

        return res.status(201).json({ message: 'Success', token })

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function to add products
const addProduct = async (req, res) => {
    try {
        const { name, category, price } = req.body
        const image = req.file.filename
        const newProduct = new Product({
            name,
            category,
            price,
            image
        })
        await newProduct.save()
        return res.status(201).json({ message: 'Success' })
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for getting distinct categories
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category')
        res.status(200).json(categories)
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for getting products with filteration
const getProducts = async (req, res) => {
    try {
        const filter = req.query.filter
        if (filter == 'All') {
            const products = await Product.find()
            res.status(200).json(products)
        } else {
            const products = await Product.find({ category: filter })
            res.status(200).json(products)
        }

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for getting details of given products ids
const getProductDetails = async (req, res) => {
    try {
        const productIds = req.body
        const products = await Product.find({ _id: { $in: productIds } });
        res.status(200).json(products)
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for add to cart, increment product in the cart
const addToCart = async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const product = await Product.findOne({ _id: productId })
        const cart = await Cart.findOne({ user: userId })

        if (cart) {
            const existProductIndex = cart.products.findIndex(p => p.productId.toString() === productId);
            if (existProductIndex != -1) {
                await Cart.findOneAndUpdate({ user: userId, 'products.productId': productId },
                    {
                        $inc: {
                            'products.$.quantity': 1,
                            'products.$.totalPrice': 1 * product.price
                        }
                    })
            } else {
                const total = 1 * product.price
                await Cart.findOneAndUpdate({ user: userId },
                    {
                        $push: {
                            products: {
                                productId: req.body.productId,
                                quantity: req.body.quantity,
                                price: product.price,
                                totalPrice: total
                            }
                        }
                    }
                )
            }
        } else {
            const total = 1 * product.price
            const cartData = new Cart({
                user: userId,
                products: [{
                    productId: productId,
                    quantity: req.body.quantity,
                    price: product.price,
                    totalPrice: total
                }]
            })
            await cartData.save()
        }
        return res.status(200).json({ message: 'Success' })

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for getting current user cart details
const getCart = async (req, res) => {
    try {
        const { userId } = req.body
        const cart = await Cart.findOne({ user: userId }).populate('products.productId')
        res.status(200).json(cart)
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for decrementing products quantity in cart
const decrementCount = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const product = await Product.findOne({ _id: productId })
        const cart = await Cart.findOne({ user: userId })

        if (cart) {
            const existProduct = cart.products.find(p => p.productId.toString() === productId);
            if (existProduct.quantity > 1) {
                await Cart.findOneAndUpdate({ user: userId, 'products.productId': productId },
                    {
                        $inc: {
                            'products.$.quantity': -1,
                            'products.$.totalPrice': -product.price
                        }
                    }
                )
            }
        }
        res.status(200).json({ message: 'Success' })

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Function for deleting products from cart
const deleteFromCart = async (req, res) => {
    try {
        const { userId } = req.body
        const productId = req.query.productId
        const cartData = await Cart.findOne({ user: userId })

        if (cartData.products.length === 1) {
            await Cart.deleteOne({ user: userId })
        } else {
            await Cart.updateOne({ user: userId },
                { $pull: { products: { productId: productId } } })
        }

        res.status(200).json({ message: 'Success' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

module.exports = {
    signin,
    signup,
    addProduct,
    getCategories,
    addToCart,
    deleteFromCart,
    getProducts,
    getProductDetails,
    getCart,
    decrementCount,
}
