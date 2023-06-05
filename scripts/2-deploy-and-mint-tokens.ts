import { getRandomNonce, toNano, WalletTypes } from "locklift";
import { Address } from "locklift/everscale-provider";
import { from } from "rxjs";

const main = async () => {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const owner = await locklift.factory.accounts.addExistingAccount({
    address: new Address("0:09e8e6bfa15e019d607e32443b057e3f7ae0d8839f282d17c596862a2806d9b4"),
    type: WalletTypes.EverWallet,
  });
  const ZERO_ADDRESS = new Address("0:0000000000000000000000000000000000000000000000000000000000000000");
  const tokenWalletCode = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
  const platformCode = locklift.factory.getContractArtifacts("TokenWalletPlatform");

  const { contract } = await locklift.factory.deployContract({
    contract: "TokenRootUpgradeable",
    initParams: {
      name_: "Locklift Token",
      symbol_: "LKT",
      decimals_: 9,
      rootOwner_: owner.address,
      walletCode_: tokenWalletCode.code,
      randomNonce_: locklift.utils.getRandomNonce(),
      deployer_: ZERO_ADDRESS,
      platformCode_: platformCode.code,
    },
    publicKey: signer.publicKey,
    value: locklift.utils.toNano(3),
    constructorParams: {
      initialSupplyTo: owner.address,
      initialSupply: toNano(1000000000),
      deployWalletValue: locklift.utils.toNano(0.1),
      mintDisabled: false,
      burnByRootDisabled: false,
      burnPaused: false,
      remainingGasTo: owner.address,
    },
  });
  console.log(`TokenRootUpgradeable deployed at ${contract.address}`);
};

main().catch(e => console.error(e));
