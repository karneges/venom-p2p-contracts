import { getRandomNonce, toNano, WalletTypes } from "locklift";
import { concatMap, from, lastValueFrom, map, switchMap } from "rxjs";
import { Address } from "locklift/everscale-provider";

export default async () => {
  const alice = locklift.deployments.getAccount("alice");
  const bob = locklift.deployments.getAccount("bob");

  const tokens = ["SOL", "USDT"];
  await lastValueFrom(
    from(tokens).pipe(
      concatMap(token =>
        from(
          locklift.deployments.deployAccounts([
            {
              deploymentName: `${token}-owner`,
              accountSettings: {
                type: WalletTypes.EverWallet,
                value: toNano(100000),
                nonce: locklift.utils.getRandomNonce(),
              },
              signerId: "0",
            },
          ]),
        ).pipe(
          map(([owner]) => owner),
          switchMap(tokenOwner => {
            const ZERO_ADDRESS = new Address("0:0000000000000000000000000000000000000000000000000000000000000000");
            const tokenWalletCode = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
            const platformCode = locklift.factory.getContractArtifacts("TokenWalletPlatform");
            return from(
              locklift.deployments.deploy({
                deploymentName: `${token}`,
                deployConfig: {
                  contract: "TokenRootUpgradeable",
                  initParams: {
                    name_: token,
                    symbol_: token,
                    decimals_: 9,
                    rootOwner_: tokenOwner.account.address,
                    walletCode_: tokenWalletCode.code,
                    randomNonce_: locklift.utils.getRandomNonce(),
                    deployer_: ZERO_ADDRESS,
                    platformCode_: platformCode.code,
                  },
                  publicKey: tokenOwner.signer.publicKey,
                  value: locklift.utils.toNano(2),
                  constructorParams: {
                    initialSupplyTo: ZERO_ADDRESS,
                    initialSupply: 0,
                    deployWalletValue: 0,
                    mintDisabled: false,
                    burnByRootDisabled: false,
                    burnPaused: false,
                    remainingGasTo: tokenOwner.account.address,
                  },
                },
                enableLogs: true,
              }),
            );
          }),
        ),
      ),
    ),
  );
};

export const tag = "tokens";
