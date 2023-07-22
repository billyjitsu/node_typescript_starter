import { config } from "dotenv"
import { IBundler, Bundler } from '@biconomy/bundler'
import { ChainId } from "@biconomy/core-types";
import { BiconomySmartAccount, BiconomySmartAccountConfig, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account"
import { Wallet, providers, ethers } from 'ethers'

config()
const provider = new providers.JsonRpcProvider("https://rpc.ankr.com/polygon_mumbai")
const wallet = new Wallet(process.env.PRIVATE_KEY || "", provider);
const bundler: IBundler = new Bundler({
    bundlerUrl: 'https://bundler.biconomy.io/api/v2/80001/abc',
    chainId: ChainId.POLYGON_MUMBAI,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  })


const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
  signer: wallet,
  chainId: ChainId.POLYGON_MUMBAI,
  bundler: bundler
}

async function createAccount() {
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
  const biconomySmartAccount =  await biconomyAccount.init()
  console.log("owner: ", biconomySmartAccount.owner)
  console.log("address: ", await biconomySmartAccount.getSmartAccountAddress())
  return biconomyAccount
}

async function createTransaction() {
  console.log("creating account")

  const smartAccount = await createAccount();

  const transaction = {
    to: '0xe2b8651bF50913057fF47FC4f02A8e12146083B8',
    data: '0x',
    value: ethers.utils.parseEther('0.1'),
  }

  const userOp = await smartAccount.buildUserOp([transaction])
  userOp.paymasterAndData = "0x"

  const userOpResponse = await smartAccount.sendUserOp(userOp)

  const transactionDetail = await userOpResponse.wait()

  console.log("transaction detail below")
  console.log(transactionDetail)
}

createTransaction()