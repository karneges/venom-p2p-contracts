import { expect } from "chai";
import { Contract, Signer, toNano } from "locklift";
import { FactorySource, P2PRootAbi, TokenRootUpgradeableAbi } from "../build/factorySource";
import { TokenWallet } from "./utils/tokenWallets";

describe("Test Sample contract", async function () {
  before(async () => {
    await locklift.deployments.fixture();
  });

  it("root should be deployed", async () => {
    const p2pRoot = locklift.deployments.getContract<P2PRootAbi>("p2p-root");
    const USDTTokenRoot = locklift.deployments.getContract<TokenRootUpgradeableAbi>("USDT");
    expect(
      p2pRoot.methods
        .accounts()
        .call()
        .then(res => res.accounts),
    ).to.be.exist;
    const alice = locklift.deployments.getAccount("alice");
    const aliceTokenWallet = await TokenWallet.getWallet(alice.account.address, USDTTokenRoot);
    expect(await aliceTokenWallet.getBalance()).to.be.eq(toNano(1000000));
  });

  it("alice should create an order", async () => {
    const p2pRoot = locklift.deployments.getContract<P2PRootAbi>("p2p-root");
    const alice = locklift.deployments.getAccount("alice");
    const USDTTokenRoot = locklift.deployments.getContract<TokenRootUpgradeableAbi>("USDT");
    const SOLTokenRoot = locklift.deployments.getContract<TokenRootUpgradeableAbi>("SOL");

    const aliceUSDTTokenWallet = await TokenWallet.getWallet(alice.account.address, USDTTokenRoot);
    const aliceSOLTokenWallet = await TokenWallet.getWallet(alice.account.address, SOLTokenRoot);

    const { traceTree } = await locklift.tracing.trace(
      p2pRoot.methods.createP2PAccounts().send({
        amount: toNano(2),
        from: alice.account.address,
      }),
    );
    expect(traceTree).to.emit("AccountCreated").withNamedArgs({
      user: alice.account.address,
    });

    const [rootAccount] = await p2pRoot.methods
      .accounts()
      .call()
      .then(res => res.accounts);

    expect(rootAccount[0].equals(alice.account.address)).to.be.true;

    const aliceP2PAccount = await p2pRoot.methods
      .getAccountAddress({ _user: alice.account.address })
      .call()
      .then(res => locklift.factory.getDeployedContract("P2PAccount", res.value0));

    const orderAmount = toNano(100);
    const p2pAccountUSDTTokenWallet = await USDTTokenRoot.methods
      .walletOf({ answerId: 0, walletOwner: aliceP2PAccount.address })
      .call()
      .then(res => res.value0);
    const tokenTransferPayload = await aliceP2PAccount.methods
      .buildCreateOrderPayload({
        _order: {
          receiveTokenRoot: USDTTokenRoot.address,
          spendTokenRoot: SOLTokenRoot.address,
          spendAmount: orderAmount,
          receiveAmount: toNano(100),
          receiveAccountTokenWallet: p2pAccountUSDTTokenWallet,
        },
      })
      .call()
      .then(res => res.value0);

    const { traceTree: traceTree2 } = await locklift.tracing.trace(
      aliceSOLTokenWallet.transferTokens(
        {
          amount: toNano(3),
        },
        {
          amount: orderAmount,
          payload: tokenTransferPayload,
          deployWalletValue: toNano(0.1),
          notify: true,
          remainingGasTo: alice.account.address,
          recipient: aliceP2PAccount.address,
        },
      ),
    );

    expect(traceTree2).to.emit("OrderCreated").withNamedArgs({
      user: alice.account.address,
      orderNonce: "0",
    });
    const aliceP2PAccountDetails = await aliceP2PAccount.methods
      .getDetails()
      .call()
      .then(res => res.value0);
    expect(aliceP2PAccountDetails.orders[0][1].state).to.be.eq("1");
    expect(aliceP2PAccountDetails.orders[0][1].spendAmount).to.be.eq(orderAmount);
    expect(aliceP2PAccountDetails.orders[0][1].receiveAmount).to.be.eq(toNano(100));
    expect(aliceP2PAccountDetails.orders[0][1].receiveTokenRoot.equals(USDTTokenRoot.address)).to.be.true;
    expect(aliceP2PAccountDetails.orders[0][1].spendTokenRoot.equals(SOLTokenRoot.address)).to.be.true;
    expect(aliceP2PAccountDetails.orders[0][1].receiveAccountTokenWallet.equals(p2pAccountUSDTTokenWallet)).to.be.true;

    // bob going to submit an order

    const bob = locklift.deployments.getAccount("bob");
    const bobUSDTTokenWallet = await TokenWallet.getWallet(bob.account.address, USDTTokenRoot);
    const bobSOLTokenWallet = await TokenWallet.getWallet(bob.account.address, SOLTokenRoot);

    const submitOrderPayload = await aliceP2PAccount.methods
      .buildSubmitOrderPayload({
        _orderNonce: 0,
      })
      .call()
      .then(res => res.value0);

    {
      const { traceTree } = await locklift.tracing.trace(
        bobUSDTTokenWallet.transferTokens(
          {
            amount: toNano(3),
          },
          {
            amount: toNano(100),
            payload: submitOrderPayload,
            deployWalletValue: toNano(0.1),
            notify: true,
            remainingGasTo: bob.account.address,
            recipient: aliceP2PAccount.address,
          },
        ),
        { raise: false },
      );
      await traceTree?.beautyPrint();
      expect(traceTree).to.emit("OrderSubmitted").withNamedArgs({
        user: alice.account.address,
        orderNonce: "0",
        buyer: bob.account.address,
      });

      const aliceUsdtTokenWallet = await TokenWallet.getWallet(alice.account.address, USDTTokenRoot);
      expect(await aliceUsdtTokenWallet.getBalance()).to.be.eq(toNano(1000000 + 100));
      expect(await aliceSOLTokenWallet.getBalance()).to.be.eq(toNano(1000000 - 100));
      expect(await bobUSDTTokenWallet.getBalance()).to.be.eq(toNano(1000000 - 100));
      expect(await bobSOLTokenWallet.getBalance()).to.be.eq(toNano(1000000 + 100));
      const aliceP2PAccountDetails = await aliceP2PAccount.methods
        .getDetails()
        .call()
        .then(res => res.value0);
      expect(aliceP2PAccountDetails.orders[0][1].state).to.be.eq("3");
    }
  });
});
