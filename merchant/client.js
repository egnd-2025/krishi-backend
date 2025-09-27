import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import 'dotenv/config';

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY not set in .env file");
}

const account = privateKeyToAccount(`0x${privateKey}`);
const client = createWalletClient({
  account,
  chain: polygonAmoy,
  transport: http()
});

console.log("Using wallet address:", account.address);

const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.polygon.technology";

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const url = process.env.QUICKSTART_RESOURCE_URL || 'http://127.0.0.1:4021/order/seeds';

fetchWithPayment(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    product: "Basmati Rice Seeds",
    quantity: 5
  })
})
  .then(async response => {
    const body = await response.json();
    console.log(body);

    const paymentResponse = decodeXPaymentResponse(response.headers.get("x-payment-response"));
    console.log(paymentResponse);
  })
  .catch(async error => {
    console.error('Error:', error.message);
    if (error.response) {
      const text = await error.response.text();
      console.error('Response text:', text);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }); 