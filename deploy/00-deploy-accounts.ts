// deploy/00-deploy-sample.ts
import { getRandomNonce, toNano, WalletTypes } from "locklift";

export default async () => {
  const accountsNames = ["alice", "bob", "carol"];
  await locklift.deployments.deployAccounts(
    Array.from({ length: 3 }, (_, i) => ({
      deploymentName: accountsNames[i],
      accountSettings: {
        type: WalletTypes.EverWallet,
        value: toNano("1000000"),
        nonce: getRandomNonce(),
      },
      signerId: "0",
    })),
  );
};

export const tag = "common-accounts";
