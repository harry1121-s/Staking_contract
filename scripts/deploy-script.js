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
      mstake = await masterStake.deploy("0x6ED852dC8Cdf90c895C05585135B1bE6b876b65b", "0xa3566812a7a6C64aed7731Ac81E77D2C1B5D5485", "12000000000000000000", blockNumBefore + 100, blockNumBefore, currTime + 24*60*60);
      await mstake.deployed();

      // const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      // lp1 = await ERC20Mock.deploy("LPToken1", "LP1", "1000000000000000000000000");
      // await lp1.deployed();
      // lp2 = await ERC20Mock.deploy("LPToken2", "LP2", "1000000000000000000000000");
      // await lp2.deployed();
      // nftaddr = new ethers.Contract(nft.address, nftABI, account);

      console.log("Staking contract deployed at address: ",mstake.address);
      // console.log("LP1 contract deployed at address: ",lp1.address);
      // console.log("LP2 contract deployed at address: ",lp2.address);
      // // console.log(nftaddr.address);

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
})