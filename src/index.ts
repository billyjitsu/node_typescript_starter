import { config } from "dotenv";
import { IBundler, Bundler } from "@biconomy/bundler";
import {
  IPaymaster,
  BiconomyPaymaster,
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import { ChainId } from "@biconomy/core-types";
import {
  BiconomySmartAccount,
  BiconomySmartAccountConfig,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { Wallet, providers, ethers } from "ethers";

config();
const provider = new providers.JsonRpcProvider(
  "https://rpc.ankr.com/polygon_mumbai"
); //https://rpc.ankr.com/polygon_zkevm //https://rpc.ankr.com/polygon_mumbai
const wallet = new Wallet(process.env.PRIVATE_KEY || "", provider);


const bundler: IBundler = new Bundler({
  bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/abc",
  chainId: ChainId.POLYGON_MUMBAI, // POLYGON_ZKEVM_TESTNET  //POLYGON_MUMBAI
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});

const paymaster: IPaymaster = new BiconomyPaymaster({
  paymasterUrl:
    "https://paymaster.biconomy.io/api/v1/80001/0Wj_tFgBz.8aeb7b41-a59d-4b06-8aa6-217f5974f4e3", // you can get this value from biconomy dashboard.
});

const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
  signer: wallet,
  chainId: ChainId.POLYGON_MUMBAI, //POLYGON_ZKEVM_TESTNET  // POLYGON_MUMBAI
  bundler: bundler,
  paymaster: paymaster,
};

async function createAccount() {
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
  const biconomySmartAccount = await biconomyAccount.init();
  console.log("owner: ", biconomySmartAccount.owner);
  console.log("address: ", await biconomySmartAccount.getSmartAccountAddress());
  //console.log("balances: ", await biconomySmartAccount.getAllTokenBalances({ chainId: ChainId.POLYGON_MUMBAI, eoaAddress: biconomySmartAccount.owner, tokenAddresses:[]}))
  return biconomyAccount;
}

// async function createTransaction() {
//   try {
//     console.log("creating account");

//     const smartAccount = await createAccount();

//     const newSmartAddress = await smartAccount.getSmartAccountAddress();

//     const tx = {
//       to: newSmartAddress,
//       let partialUserOp = await smartAccount.buildUserOp([transaction, transaction,]);
//     };

//     const response = await wallet.sendTransaction(tx);
//     console.log("Transaction hash:", response.hash);

//     const transaction = {
//       to: "0xe2b8651bF50913057fF47FC4f02A8e12146083B8",
//       data: "0x",
//       value: ethers.utils.parseEther("0.001"),
//     };

//     console.log("building user op");
//     const userOp = await smartAccount.buildUserOp([transaction]);
//     userOp.paymasterAndData = "0x";
//     console.log("sending user op");

//     const userOpResponse = await smartAccount.sendUserOp(userOp);

//     console.log("user op response below");
//     const transactionDetail = await userOpResponse.wait();

//     console.log("transaction detail below");
//     console.log(transactionDetail);
//   } catch (error) {
//     console.log(error);
//   }
// }

// createTransaction();

async function sponsoredTransaction() {
  const smartAccount = await createAccount();

  const scwAddress = await smartAccount.getSmartAccountAddress();

  const transaction = {
    to: scwAddress,
    data: "0x",
    value: ethers.utils.parseEther("0.001"),
  };

  let partialUserOp = await smartAccount.buildUserOp([transaction,]);

  const biconomyPaymaster = smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  let paymasterServiceData: SponsorUserOperationDto = {mode: PaymasterMode.SPONSORED,};

  try {
    const paymasterAndDataResponse = await biconomyPaymaster.getPaymasterAndData(partialUserOp, paymasterServiceData);
    partialUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
  } catch (e) {
    console.log("error received ", e);
  }

  try {
    const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
    console.log(`userOp Hash: ${userOpResponse.userOpHash}`);
    const transactionDetails = await userOpResponse.wait();
    console.log(
      `transactionDetails: ${JSON.stringify(
        transactionDetails.logs[0].transactionHash,
        null,
        "\t"
      )}`
    );
  } catch (e) {
    console.log("error received ", e);
  }
}

// async function mintNFTUSDC() {
//   const smartAccount = await createAccount();

//   const nftInterface = new ethers.utils.Interface([
//     "function safeMint(address _to)",
//   ]);

//   const scwAddress = await smartAccount.getSmartAccountAddress();

//   const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

//   const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";

//   const transaction = {
//     to: nftAddress,
//     data: data,
//   };

//   let partialUserOp = await smartAccount.buildUserOp([
//     transaction,
//     transaction,
//   ]);
//   let finalUserOp = partialUserOp;

//   const biconomyPaymaster =
//     smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

//   const feeQuotesResponse = await biconomyPaymaster.getPaymasterFeeQuotesOrData(
//     partialUserOp,
//     {
//       mode: PaymasterMode.ERC20,
//       tokenList: [],
//     }
//   );

//   const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[];
//   const spender = feeQuotesResponse.tokenPaymasterAddress || "";
//   const usdcFeeQuotes = feeQuotes[1];
//   console.log(usdcFeeQuotes);

//   finalUserOp = await smartAccount.buildTokenPaymasterUserOp(partialUserOp, {
//     feeQuote: usdcFeeQuotes,
//     spender: spender,
//     maxApproval: false,
//   });

//   let paymasterServiceData = {
//     mode: PaymasterMode.ERC20,
//     feeTokenAddress: usdcFeeQuotes.tokenAddress,
//   };

//   try {
//     const paymasterAndDataWithLimits =
//       await biconomyPaymaster.getPaymasterAndData(
//         finalUserOp,
//         paymasterServiceData
//       );
//     finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;
//   } catch (e) {
//     console.log("error received ", e);
//   }

//   try {
//     const userOpResponse = await smartAccount.sendUserOp(finalUserOp);
//     const transactionDetails = await userOpResponse.wait();
//     console.log(
//       `transactionDetails: ${JSON.stringify(
//         transactionDetails.logs[0].transactionHash,
//         null,
//         "\t"
//       )}`
//     );
//   } catch (e) {
//     console.log("error received ", e);
//   }
// }

sponsoredTransaction();
