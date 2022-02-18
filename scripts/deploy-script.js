const fs = require('fs');
const { web3, ethers } = require('hardhat');
const CONFIG = require("../credentials.json");
// const nftABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/NFT.sol/NFT.json', 'utf8'))).abi;

contract("Staking deployment", () => {
    let currTime;
    // let tx;

    const provider = new ethers.providers.JsonRpcProvider(CONFIG["BSCTESTNET"]["URL"]);
    const signer = new ethers.Wallet(CONFIG["BSCTESTNET"]["PKEY"]);
    const account = signer.connect(provider);

    before(async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      currTime = blockBefore.timestamp;

      const masterStake = await ethers.getContractFactory("masterStake");
      mstake = await masterStake.deploy("0x6ED852dC8Cdf90c895C05585135B1bE6b876b65b", "0xa3566812a7a6C64aed7731Ac81E77D2C1B5D5485", 12, blockNumBefore + 100, blockNumBefore, currTime + 28*24*60*60);
      await mstake.deployed();

      // nftaddr = new ethers.Contract(nft.address, nftABI, account);

      console.log("NFT deployed at address: ",mstake.address);
      // console.log(nftaddr.address);

    })

    after(async () => {
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
    })

    it("Should deploy the Staking contract",async() => {
      console.log("Staking contract deployed at address: ",mstake.address);
    })
    // it ("should set correct params for NFT mint", async () => {
		// tx = await nft.setBaseURI("https://ipfs.io/ipfs/");
		// await tx.wait()
		// tx = await nft.setProvenanceHash("PROVENANCE");
		// await tx.wait()
		// // tx = await nft.addWhiteListedAddresses([accounts[1].address, accounts[2].address, accounts[3].address, accounts[4].address]);
    // // await tx.wait()
		// tx = await nft.setPreSale();
    // await tx.wait()
    // tx = await nft.setPublicSale();
    // await tx.wait()
    // tx = await nft.setNotRevealedURI("NULL");
    // await tx.wait()
    // })
})