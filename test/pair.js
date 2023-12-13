const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CosmicSwapPair", function () {
  async function deployContractsFixture() {
    const MINIMUM_LIQUIDITY = BigInt(1000);
    const PRECISION = 10 ** 4; // 4 decimal places
    const DELTA = ethers.parseUnits('0.0001', /* decimals */ 18);

    const TokenA = await ethers.getContractFactory("MintableToken");
    const tokenA = await TokenA.deploy("Token A", "TKA");

    const TokenB = await ethers.getContractFactory("MintableToken");
    const tokenB = await TokenB.deploy("Token B", "TKB");

    const PairA_B = await ethers.getContractFactory("CosmicSwapPair");
    const pairA_B = await PairA_B.deploy(tokenA.target, tokenB.target);

    const [owner, other] = await ethers.getSigners();

    return { tokenA, tokenB, pairA_B, owner, other, MINIMUM_LIQUIDITY, PRECISION, DELTA };
  }

  describe("Deployment", function () {
    it("Should set the right tokenA and tokenB addresses", async () => {
      const { tokenA, tokenB, pairA_B } = await loadFixture(
        deployContractsFixture
      );

      expect(await pairA_B.token0()).to.equal(tokenA.target);
      expect(await pairA_B.token1()).to.equal(tokenB.target);
    });

    it("Should set the right name and symbol", async () => {
      const { pairA_B } = await loadFixture(
        deployContractsFixture
      );

      expect(await pairA_B.name()).to.equal("CosmicSwap");
      expect(await pairA_B.symbol()).to.equal("COS");
    });
  });

  describe("Minting", function () {
    it("Owner should have 7000 tokenAs and 7000 tokenBs", async () => {
      const { tokenA, tokenB, pairA_B, owner } = await loadFixture(
        deployContractsFixture
      );

      expect(await tokenA.balanceOf(owner.address)).to.equal(ethers.parseEther("7000"));
      expect(await tokenB.balanceOf(owner.address)).to.equal(ethers.parseEther("7000"));
    });

    it("Pair should receive the amount of tokens the owner sent", async () => {
      const { tokenA, tokenB, pairA_B, owner } = await loadFixture(
        deployContractsFixture
      );
      await tokenA.connect(owner).transfer(pairA_B.target, ethers.parseEther("10"));
      await tokenB.connect(owner).transfer(pairA_B.target, ethers.parseEther("20"));

      expect(await tokenA.balanceOf(pairA_B.target)).to.equal(ethers.parseEther("10"));
      expect(await tokenB.balanceOf(pairA_B.target)).to.equal(ethers.parseEther("20"));
    });

    it("Pair should mint the right amount of liquidity tokens", async () => {
      const { tokenA, tokenB, pairA_B, owner, other, PRECISION, DELTA } = await loadFixture(
        deployContractsFixture
      );
      tokenA.connect(owner).mint(other.address, ethers.parseEther("7000"));
      tokenB.connect(owner).mint(other.address, ethers.parseEther("7000"));

      // FIRST amount of LP tokens received after mint should be smaller 
      // than normal due to the MINIMUM_LIQUIDITY minting to address 0
      await tokenA.connect(owner).transfer(pairA_B.target, ethers.parseEther("10"));
      await tokenB.connect(owner).transfer(pairA_B.target, ethers.parseEther("20"));

      await pairA_B.mint(owner.address);

      const expected = Math.sqrt(10 * 20) - 1 / 10 ** 15
      expect(ethers.formatEther(await pairA_B.balanceOf(owner.address)) * PRECISION).to.equal(expected * PRECISION)

      let totalSupply1 = await pairA_B.totalSupply();
      expect(ethers.formatEther(totalSupply1) * PRECISION).to.equal(Math.sqrt(10 * 20) * PRECISION);


      // SECOND mint should be normal
      let amount0 = BigInt(30);
      let amount1 = BigInt(60);
      let [reserve0, reserve1] = await pairA_B.getReserves();

      await tokenA.connect(other).transfer(pairA_B.target, ethers.parseEther(amount0.toString()));
      await tokenB.connect(other).transfer(pairA_B.target, ethers.parseEther(amount1.toString()));

      let expected1 = (parseFloat(amount0) * parseFloat(totalSupply1)) / parseFloat(reserve0);
      let expected2 = (parseFloat(amount1) * parseFloat(totalSupply1)) / parseFloat(reserve1);
      expect(expected1).to.equal(expected2);

      /* const liquidity = */ await pairA_B.mint(other.address);
      // expect(liquidity).to.equal(expected1)
      const balanceOfOther = await pairA_B.balanceOf(other.address);
      expect(balanceOfOther).to.be.closeTo(ethers.parseEther(expected1.toString()), DELTA);

      totalSupply2 = await pairA_B.totalSupply();
      expect((ethers.formatEther(totalSupply2 - totalSupply1)) * PRECISION).to.equal(expected1 * PRECISION);


      // THIRD mint should be normal
      amount0 = BigInt(20);
      amount1 = BigInt(50);
      [reserve0, reserve1] = await pairA_B.getReserves();

      await tokenA.connect(other).transfer(pairA_B.target, ethers.parseEther(amount0.toString()));
      await tokenB.connect(other).transfer(pairA_B.target, ethers.parseEther(amount1.toString()));

      expected1 = (parseFloat(amount0) * parseFloat(totalSupply2)) / parseFloat(reserve0);
      expected2 = (parseFloat(amount1) * parseFloat(totalSupply2)) / parseFloat(reserve1);
      expect(expected1).to.be.lessThan(expected2);

      /* liquidity = */ await pairA_B.mint(other.address);
      // expect(liquidity).to.equal(expected1)
      expect((await pairA_B.balanceOf(other.address)) - balanceOfOther).to.be.closeTo(ethers.parseEther(expected1.toString()), DELTA);
    });

  });

  describe("Burning", function () {
    it("Pair should burn the right amount of liquidity tokens", async () => {
      const { tokenA, tokenB, pairA_B, owner, MINIMUM_LIQUIDITY, PRECISION } = await loadFixture(
        deployContractsFixture
      );
      // PRE MINTING: owner should have 7000 tokenAs and 7000 tokenBs and 0 LP tokens 
      expect(await tokenA.balanceOf(owner.address)).to.equal(ethers.parseEther("7000"));
      expect(await tokenB.balanceOf(owner.address)).to.equal(ethers.parseEther("7000"));
      expect(await pairA_B.balanceOf(owner.address)).to.equal(0);

      // POST MINTING: owner should have 6990 tokenAs and 6980 tokenBs and sqrt(10 * 20) - MINIMUM_LIQUIDITY LP tokens
      await tokenA.connect(owner).transfer(pairA_B.target, ethers.parseEther("10"));
      await tokenB.connect(owner).transfer(pairA_B.target, ethers.parseEther("20"));
      await pairA_B.mint(owner.address);

      const expected = (Math.sqrt(10 * 20) - 1 / 10 ** 15) // 14.142135623730951
      expect(ethers.formatEther(await pairA_B.balanceOf(owner.address)) * PRECISION).to.equal(expected * PRECISION)

      // POST_BURNING
      await pairA_B.connect(owner).transfer(pairA_B.target, ethers.parseEther("14"));
      await pairA_B.burn(owner.address);

      // check the amount of LP tokens sent to be burned are substraced from the balance of owner
      expect(await pairA_B.balanceOf(owner.address)).to.be.closeTo(ethers.parseEther("0.142135623730950"), ethers.parseEther("0.000000000000001"));

      // check the total supply is also updated after the burning event
      expect(await pairA_B.totalSupply()).to.be.closeTo(ethers.parseEther("0.142135623730950"), ethers.parseEther("0.000000000000001"));
    });
  });

  describe("Swap", function () {
    it("Should swap and transfer to user the rigth amount of desired token", async () => {
      const { tokenA, tokenB, pairA_B, owner, other } = await loadFixture(
        deployContractsFixture
      );
      // 1st PART: PROVIDING LIQUIDITY TO POOL
      // give tokens to other
      await tokenA.connect(other).mint(other.address, ethers.parseEther("1000"));
      await tokenB.connect(other).mint(other.address, ethers.parseEther("1000"));

      // 1st mint by owner
      await tokenA.connect(owner).transfer(pairA_B.target, ethers.parseEther("100"));
      await tokenB.connect(owner).transfer(pairA_B.target, ethers.parseEther("200"));
      await pairA_B.connect(owner).mint(owner.address);

      // 2nd mint by other
      await tokenA.connect(other).transfer(pairA_B.target, ethers.parseEther("200"));
      await tokenB.connect(other).transfer(pairA_B.target, ethers.parseEther("400"));
      await pairA_B.connect(other).mint(other.address);

      // pool should have 300 tokenAs and 600 tokenBs
      expect(await tokenA.balanceOf(pairA_B.target)).to.equal(ethers.parseEther("300"));
      expect(await tokenB.balanceOf(pairA_B.target)).to.equal(ethers.parseEther("600"));


      // 2nd PART: SWAPPING

      let [reserve0, reserve1] = await pairA_B.getReserves();
      let amount0 = BigInt(50);
      let amount1 = amount0 * reserve1 / reserve0; // 50 * 600 / 300 = 100
      // await pairA_B.connect(owner).swap(ethers.parseEther(amount0.toString()), ethers.parseEther("0"), owner.address);
      // expect(await tokenA.balanceOf(owner.address)).to.equal(ethers.parseEther("6850"));
      // expect(await tokenB.balanceOf(owner.address)).to.equal(ethers.parseEther("150"));
    });
  });
});
