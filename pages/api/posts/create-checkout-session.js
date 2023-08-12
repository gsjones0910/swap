const PRIVATE_KEY = process.env.NEXT_PUBLIC_STRIPE_PRIVATE_KEY;
const stripe = require("stripe")(PRIVATE_KEY);
const Moralis = require("moralis-v1/node");
//const crypto = require('crypto');
const CryptoJS = require('crypto-js');
import { v4 as uuidv4 } from 'uuid';

const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL
export default async function handle(req, res) {
  const env = {
    APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    APP_SERVER_URL: process.env.NEXT_PUBLIC_APP_SERVER_URL,
    APP_MASTER_KEY: process.env.NEXT_PUBLIC_PRIVATE_APP_MASTER_KEY
  }
  const payid = uuidv4();
  if (req.method === 'POST') {
    try {
      const { item } = req.body;
      const redirectURL = process.env.NEXT_PUBLIC_APP_URL;

      await Moralis.start({ serverUrl: env.APP_SERVER_URL, appId: env.APP_ID, masterKey: env.APP_MASTER_KEY })
      if (item.address.length < 10 || item.email.length < 3 || item.price.length == 0 || item.amount <= 0)
        res.status(500).json({ msg: "Internal Server Error!!!" });

      if (item.token.length < 20)
        res.status(500).json({ msg: "Internal Server Error!!!" });

      const desc = "You will buy " + item.amount + " YLT Tokens and those will transferred directly to your wallet address : [ " + item.address + " ]";

      const transformedItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            images: [item.image],
            name: item.name
          },
          unit_amount: item.price * 100
        },
        description: desc,
        quantity: item.quantity
      }

      const hash_1 = payid.replace(/-/g, '');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [transformedItem],
        mode: 'payment',
        success_url: YOUR_DOMAIN + '?status=success&token=' + hash_1 + '&timestamp=' + item.token,
        cancel_url: YOUR_DOMAIN + '?status=cancel&token=' + item.token,
        metadata: {
          images: item.image,
          buyer: item.address,
          amount: item.amount,
          uid: item.uid,
        }
      });
      const data = {
        email: item.email,
        address: item.address,
        amount: item.price.toString(),
        token_amount: item.amount.toString(),
        token: hash_1,
        uid: item.uid,
      } 
      await Moralis?.Cloud.run("saveTempFile", data);
      res.status(200).json({ id: session.id });
    } catch (e) {

    } 

  }
}
