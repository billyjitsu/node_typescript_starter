import { config } from "dotenv"
import { IBundler, Bundler } from '@biconomy/bundler'
import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster'
import { ChainId } from "@biconomy/core-types";
import { BiconomySmartAccount, BiconomySmartAccountConfig, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account"
import { Wallet, providers, ethers } from 'ethers'

config()
const provider = new providers.JsonRpcProvider("https://rpc.ankr.com/polygon_zkevm")  //https://rpc.ankr.com/polygon_zkevm //https://rpc.ankr.com/polygon_mumbai
const wallet = new Wallet(process.env.PRIVATE_KEY || "", provider);
const bundler: IBundler = new Bundler({
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/80001/abc',  // 1442,
    chainId: ChainId.POLYGON_ZKEVM_TESTNET,   // POLYGON_ZKEVM_TESTNET  //POLYGON_MUMBAI
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  })

const paymaster: IPaymaster = new BiconomyPaymaster({
  paymasterUrl: 'https://paymaster.biconomy.io/api/v1/1442/qwE3p3lk2.e29a50a3-2c5c-423e-99a4-958027e40a62' // you can get this value from biconomy dashboard.
})

const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
  signer: wallet,
  chainId: ChainId.POLYGON_ZKEVM_TESTNET,  //POLYGON_ZKEVM_TESTNET  // POLYGON_MUMBAI
  bundler: bundler,
  paymaster: paymaster
}

async function createAccount() {
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
  const biconomySmartAccount =  await biconomyAccount.init()
  console.log("owner: ", biconomySmartAccount.owner)
  console.log("address: ", await biconomySmartAccount.getSmartAccountAddress())
  return biconomyAccount
}

async function createTransaction() {
  try{
  console.log("creating account")

  const smartAccount = await createAccount();

  const transaction = {
    to: '0xe2b8651bF50913057fF47FC4f02A8e12146083B8',
    data: '0x',
    value: ethers.utils.parseEther('0.001'),
  }

  console.log("building user op");
  const userOp = await smartAccount.buildUserOp([transaction])
  userOp.paymasterAndData = "0x"
  console.log("sending user op");

  const userOpResponse = await smartAccount.sendUserOp(userOp)

  console.log("user op response below")
  const transactionDetail = await userOpResponse.wait()

  console.log("transaction detail below")
  console.log(transactionDetail)
} catch (e) {
  console.log(e)
}
}

createTransaction()