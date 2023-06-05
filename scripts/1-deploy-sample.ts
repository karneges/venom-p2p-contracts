import { WalletTypes } from "locklift";
import { Address } from "locklift/everscale-provider";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerAccount = await locklift.factory.accounts.addExistingAccount({
    type: WalletTypes.EverWallet,
    address: new Address("0:09e8e6bfa15e019d607e32443b057e3f7ae0d8839f282d17c596862a2806d9b4"),
  });
  const { code: accountCode } = locklift.factory.getContractArtifacts("P2PAccount");
  const { contract } = await locklift.factory.deployContract({
    contract: "P2PRoot",
    value: locklift.utils.toNano(3),
    publicKey: signer.publicKey,
    initParams: {
      _nonce: locklift.utils.getRandomNonce(),
      accountCode,
    },
    constructorParams: {
      _owner: ownerAccount.address,
    },
  });

  console.log(`P2PRoot deployed: ${contract.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
