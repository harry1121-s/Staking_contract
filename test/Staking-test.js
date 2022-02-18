const { expect } = require("chai");
const { ethers } = require("hardhat");
// const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545"); 


describe("Staking Contract", function () {

  let currTime;

    const advanceBlock = () => new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: new Date().getTime(),
      }, async (err, result) => {
          if (err) { return reject(err) }
          // const newBlockhash =await web3.eth.getBlock('latest').hash
          return resolve()
      })
  })

  const advanceBlocks = async (num) => {
      let resp = []
      for (let i = 0; i < num; i += 1) {
          resp.push(advanceBlock())
      }
      await Promise.all(resp)
  }

  const advancetime = (time) => new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_increaseTime',
          id: new Date().getTime(),
          params: [time],
      }, async (err, result) => {
          if (err) { return reject(err) }
          const newBlockhash = (await web3.eth.getBlock('latest')).hash

          return resolve(newBlockhash)
      })
  })


  before(async() => {
    accounts  = await ethers.getSigners();
    owner = accounts[0];
    alice = accounts[1];
    bob = accounts[2];
    eve = accounts[3];

    const blockNumBefore = await ethers.provider.getBlockNumber();
    // console.log(blockNumBefore);
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    currTime = blockBefore.timestamp;

    const myToken = await ethers.getContractFactory("myToken");
    mtoken = await myToken.deploy();
    await mtoken.deployed();

    await mtoken.mint(accounts[0].address, 1000000);

    const masterStake = await ethers.getContractFactory("masterStake");
    mstake = await masterStake.deploy(mtoken.address, accounts[0].address, 12, blockNumBefore + 100, blockNumBefore, currTime + 28*24*60*60);
    await mstake.deployed();

    await mtoken.transfer(mstake.address, "1000000000000000000000000");

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    lp1 = await ERC20Mock.deploy("LPToken", "LP", "10000000000");
    await lp1.deployed();
    lp2 = await ERC20Mock.deploy("LPToken2", "LP2", "10000000000");
    await lp2.deployed();
  })

  it("Should set correct state variables for Master Stake", async function(){

    expect(await mstake.mToken()).to.equal(mtoken.address);
    expect(await mstake.devaddr()).to.equal(owner.address);
  });
  
  it("Should transfer LP tokens", async function(){
  
    await lp1.transfer(alice.address, 10000);
    await lp1.transfer(bob.address, 10000);
    await lp1.transfer(eve.address, 10000);
    await lp2.transfer(alice.address, 10000);
    await lp2.transfer(bob.address, 10000);
    await lp2.transfer(eve.address, 10000);
  
    expect(await lp1.balanceOf(alice.address)).to.equal(10000);
    expect(await lp1.balanceOf(bob.address)).to.equal(10000);
  
  });

  it("Should create LP Pools", async function(){
    await expect(mstake.connect(alice).add(40, lp1.address, 100, true)).to.be.revertedWith("Ownable: caller is not the owner");
    await mstake.add(40, lp1.address, 100, true);
    await mstake.add(60, lp2.address, 100, true);

    expect(await mstake.poolLength()).to.equal(2);
  });
  
  it("Should allow users to stake LP Tokens", async function(){
  
    await expect(mstake.connect(alice).deposit(0, 100)).to.be.revertedWith("ERC20: insufficient allowance");
    await lp1.connect(alice).approve(mstake.address, 10);
    await expect(mstake.connect(alice).deposit(0, 10)).to.be.revertedWith("MasterStake: Amount too low");

    await lp1.connect(alice).approve(mstake.address, 1000);
    await mstake.connect(alice).deposit(0, 1000);
    
    await lp1.connect(bob).approve(mstake.address, 1000);
    // console.log(await ethers.provider.getBlockNumber());
    await mstake.connect(bob).deposit(0, 1000);
    // console.log(await ethers.provider.getBlockNumber());
    // console.log(await mstake.userInfo(0,bob.address));
    await lp1.connect(eve).approve(mstake.address, 5000);
    await mstake.connect(eve).deposit(0, 5000);
    // console.log(await mstake.userInfo(0,eve.address));

    await lp2.connect(alice).approve(mstake.address, 1000);
    await mstake.connect(alice).deposit(1, 1000);
    await lp2.connect(bob).approve(mstake.address, 2000);
    await mstake.connect(bob).deposit(1, 2000);
    await lp2.connect(eve).approve(mstake.address, 2500);
    await mstake.connect(eve).deposit(1, 2500);

  });

  it("Should not allow users to withdraw tokens", async function(){

    await expect(mstake.connect(alice).withdraw(0, 100))
    .to.be.revertedWith("MasterStake: Withdrawal locked");

  });

  it("Should allow users to withdraw tokens", async function(){

    await advancetime(29 * 24 * 60 * 60);
    await advanceBlock();

    //Withdraw rewards only
    await mstake.connect(alice).withdraw(0, 0);
    console.log(await mtoken.balanceOf(alice.address));

    await advancetime(24 * 60 * 60);
    await advanceBlock();

    await mstake.connect(alice).withdraw(0, 1000);
    console.log(await mtoken.balanceOf(alice.address));

    console.log(await mstake.userInfo(0,alice.address));



  });


  
});
