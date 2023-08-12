const getRawBody = require("raw-body");
const endpointSecret = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK;
const RewardContractAddress = process.env.NEXT_PUBLIC_REWARD_ADDRESS;
const StripeSkey = process.env.NEXT_PUBLIC_STRIPE_PRIVATE_KEY;
const stripe = require('stripe')(StripeSkey, { apiVersion: '2022-11-15' });
import REWARD from '../../contracts/abi/REWARD.json'
import { ethers } from "ethers";
const Moralis = require("moralis-v1/node");


export default async function handler(req, res) {
    const env = {
        APP_ID: process.env.NEXT_PUBLIC_APP_ID,
        APP_SERVER_URL: process.env.NEXT_PUBLIC_APP_SERVER_URL,
        APP_MASTER_KEY: process.env.NEXT_PUBLIC_PRIVATE_APP_MASTER_KEY
    }
    await Moralis.start({ serverUrl: env.APP_SERVER_URL, appId: env.APP_ID, masterKey: env.APP_MASTER_KEY })
    const headers = req.headers;

    try {
        const rawBody = await getRawBody(req);
        const stripeEvent = stripe.webhooks.constructEvent(
            rawBody,
            headers["stripe-signature"],
            endpointSecret
        );
        const object = stripeEvent.data.object;

        switch (stripeEvent.type) {
            case "checkout.session.completed":
                const buyer = object.metadata.buyer;
                const amount = object.metadata.amount;
                const uid = object.metadata.uid;    
                const privateKey = process.env.NEXT_PUBLIC_REWARD_KEY;  
                let wallet = new ethers.Wallet(privateKey);
                let provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_SERVER_URL);
                let walletWithProvider = new ethers.Wallet(privateKey, provider);
                const RewardContract = new ethers.Contract(RewardContractAddress, REWARD, walletWithProvider);
                 
                let tx = await RewardContract.transferToUser(buyer, ethers.utils.parseUnits(Number(amount).toString(), 18));
                const res = await tx.wait(); 
                await Moralis.Cloud.run("updateSwapTokenLogFromAuto", {
                    uid: uid,
                    scanid: res.transactionHash,
                    state: 1,
                });
                break;
            case "payment_intent.succeeded":
                break;
            // no default
        }

        // Send success response
        res.send({ status: "success" });
    } catch (error) {
        console.log("stripe webhook error", error);
        // Send error response
        res.send({ status: "error", code: error.code, message: error.message });
    }
};


export const config = {
    api: {
        bodyParser: false,
    },
};