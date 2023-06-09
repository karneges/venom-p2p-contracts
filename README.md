# Venom p2p

p2p transactions between users, for cases when the price in the dex is irrelevant, the pool is not created, or there is not enough liquidity. The project also solves the problem of transaction security, a user no longer needs to look for offers on OTC. **Also, these contracts can be used for implementing limit orders with depth and other exchange features**

_Current project includes a [simple front-end demo](https://venom-p2p.vercel.app/), [repo](https://github.com/karneges/venom-p2p) only for demonstrating base usage_


Architeture includes 2 type of actors.
1. **Root contract** is used for creating escrow accounts, stores pointers to escrow accounts, and also it accumulates all events (onOrderCreated, onOrderCanceled...)
2. **Account contract(escrow account)** is used for orders interaction, creating, submitting...  When the escrow account owner creates an order, his tokens are locked until the order will be completed or canceled. When the buyer submits the order escrow account sends tokens locked tokens to the buyer, and buyer's tokens will send to the escrow owner



![Untitled Diagram-Page-2.drawio.png](https://cdn.dorahacks.io/static/files/188955bc33adf8a40a301b1443497947.png)
