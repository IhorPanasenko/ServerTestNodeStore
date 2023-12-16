const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require('serverless-http')
const LiqPay = require("liqpay")

const app = express();
const privateKey = "sandbox_3KjYIs5D9uMyI63tMcVqIYkQc8YTxRqgcMimTTQ2";
const publicKey = "sandbox_i38174082832";

// Predefined in-memory data for products
const products = [
  {
    id: 1,
    name: "Product 1",
    description: "Description for Product 1",
    price: 10.99,
    inSaleAmount: 10,
  },
  {
    id: 2,
    name: "Product 2",
    description: "Description for Product 2",
    price: 20.49,
    inSaleAmount: 10,
  },
  {
    id: 3,
    name: "Product 3",
    description: "Description for Product 3",
    price: 15.99,
    inSaleAmount: 10,
  },
];

// In-memory data for the shopping cart
let cart = [];

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

const router = express.Router();

router.get('/', (req, res)=>{
    res.send('App is running...')
});

// Endpoint to get all products
router.get("/products/getall", (req, res) => {
  res.json(products);
  return res.status(200);
});

// Endpoint to add a product to the cart
router.post("/products/addtocart", (req, res) => {
  const productId = req.body.productId;
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  cart.push(product);
  res.json({ message: "Product added to cart", cart });
});

// Endpoint to get all products in the cart
router.get("/products/cart", (req, res) => {
  res.json(cart);
});

const sumOfProducts = () => {
  sum = 0;
  cart.forEach((p) => {
    sum += p.price;
  });
  return sum;
};

function base64_encode(data) {
  if (typeof btoa === "function") {
    // For browsers supporting btoa
    return btoa(unescape(encodeURIComponent(data)));
  } else if (typeof Buffer === "function") {
    // For Node.js or environments supporting Buffer
    return Buffer.from(data).toString("base64");
  } else {
    throw new Error(
      "base64_encode: Unsupported environment, neither btoa nor Buffer is available."
    );
  }
}

const crypto = require('crypto');

function sha1Binary(input) {
  const hash = crypto.createHash('sha1');
  hash.update(input);
  return hash.digest('base64');
}

function str_to_sign(str) {
  if (typeof str !== 'string') {
      throw new Error('Input must be a string');
  }

  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('base64');
};

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

router.post("/payment/initiate", (req, res) => {
  const amount = sumOfProducts();

  let newNumber = Number(amount.toFixed(2));
  let orderId = generateRandomString();
  json_string = {
    public_key: publicKey,
    version: "3",
    action: "pay",
    amount: newNumber,
    currency: "UAH",
    description: "test",
    order_id: orderId,
    server_url: "https://serverstoretest.netlify.app/payment-callback",
  };

  console.log(JSON.stringify(json_string));
  const data = Buffer.from(JSON.stringify(json_string)).toString('base64')
  const sign_signature = privateKey+data+privateKey;
  console.log(sign_signature);
  const signature = str_to_sign(privateKey+data+privateKey);
  console.log(signature)

  const responseData = {
    data: data,
    signature: signature,
    amount: Number(amount.toFixed(2)),
  };

  console.log(responseData);
  res.json(responseData);
});

// Endpoint for LiqPay callback
router.post("/payment-callback", (req, res) => {
  console.log("Payment callback received:", req);
  res.send("OK");
});


app.use('./netlify/functions/api', router)
module.exports.handler = serverless(app)

// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });
