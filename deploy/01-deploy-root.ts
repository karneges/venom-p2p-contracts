import { getRandomNonce, toNano, WalletTypes } from "locklift";

export default async () => {
  const [rootOwner] = await locklift.deployments.deployAccounts([
    {
      deploymentName: `root-owner`,
      accountSettings: {
        type: WalletTypes.EverWallet,
        value: toNano(10),
        nonce: locklift.utils.getRandomNonce(),
      },
      signerId: "0",
    },
  ]);
  const { code: accountCode } = locklift.factory.getContractArtifacts("P2PAccount");
  await locklift.deployments.deploy({
    deploymentName: "p2p-root",
    deployConfig: {
      contract: "P2PRoot",
      value: toNano(2),
      constructorParams: {
        _owner: rootOwner.account.address,
      },
      initParams: {
        _nonce: getRandomNonce(),
        accountCode,
      },
      publicKey: rootOwner.signer.publicKey,
    },
  });
};

export const tag = "p2p-root";
