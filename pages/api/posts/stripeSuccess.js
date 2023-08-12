const Moralis = require("moralis-v1/node");

export default async function handle(req, res) {
  const env = {
    APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    APP_SERVER_URL: process.env.NEXT_PUBLIC_APP_SERVER_URL,
    APP_MASTER_KEY: process.env.NEXT_PUBLIC_PRIVATE_APP_MASTER_KEY
  }

  if (req.method === 'POST') {
    let { status, timestamp, data } = req.body;
    await Moralis?.start({ serverUrl: env.APP_SERVER_URL, appId: env.APP_ID, masterKey: env.APP_MASTER_KEY })
    if (status != "success") {
      res.status(500).json({ msg: "Internal Server Error!!!" });
    } 
    let token = timestamp;
    let id, address, amount;
    const resp = await Moralis.Cloud.run("getTempFile", { token }) 
    id = resp._id;
    address = resp.address;
    amount = resp.token_amount;

    if (id == null || id == undefined || address == null || address == undefined || amount == null || amount == undefined) {
      res.status(500).json({ msg: 'Internal Server Error!!!' });
    }

    await Moralis.Cloud.run("deleteTempFile", { id: id });
    await Moralis.Cloud.run("saveTokenSwap", data);
    await Moralis.Cloud.run("sendPushAdmin", {
      to: data['address'],
      amount: data['yltAmount']
    })

    res.status(200).json({ msg: 'success' });
  }
}
