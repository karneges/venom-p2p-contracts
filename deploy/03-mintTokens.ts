import { getRandomNonce, toNano, WalletTypes } from "locklift";
import { concatMap, from, lastValueFrom, map, mergeMap, switchMap, tap } from "rxjs";
import { Address } from "locklift/everscale-provider";
import { TokenRootUpgradeableAbi } from "../build/factorySource";

export default async () => {
  const accounts = [locklift.deployments.getAccount("alice"), locklift.deployments.getAccount("bob")];
  const SOLRoot = locklift.deployments.getContract<TokenRootUpgradeableAbi>("SOL");
  const solOwner = locklift.deployments.getAccount("SOL-owner");
  const USDTRoot = locklift.deployments.getContract<TokenRootUpgradeableAbi>("USDT");
  const usdtOwner = locklift.deployments.getAccount("USDT-owner");
  await lastValueFrom(
    from([
      { token: "SOL", root: SOLRoot, owner: solOwner },
      { token: "USDT", root: USDTRoot, owner: usdtOwner },
    ]).pipe(
      mergeMap(({ token, root, owner }) => {
        return from(accounts).pipe(
          concatMap(account =>
            locklift.tracing.trace(
              root.methods
                .mint({
                  amount: toNano(1000000),
                  remainingGasTo: owner.account.address,
                  recipient: account.account.address,
                  notify: false,
                  payload: "",
                  deployWalletValue: toNano(1),
                })
                .send({
                  amount: toNano(2),
                  from: owner.account.address,
                }),
            ),
          ),
        );
      }),
    ),
  );
};

export const tag = "mint-tokens";
export const dependencies = ["common-accounts", "tokens"];
