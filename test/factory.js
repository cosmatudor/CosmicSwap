const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CosmicSwapFactory", function () {
    let factory;
    let tokenA;
    let tokenB;
    let tokenC;

    this.beforeAll(async function () {
        const Factory = await ethers.getContractFactory("CosmicSwapFactory");
        factory = await Factory.deploy();

        const TokenA = await ethers.getContractFactory("MintableToken");
        tokenA = await TokenA.deploy("Token A", "TKA");

        const TokenB = await ethers.getContractFactory("MintableToken");
        tokenB = await TokenB.deploy("Token B", "TKB");

        const TokenC = await ethers.getContractFactory("MintableToken");
        tokenC = await TokenC.deploy("Token C", "TKC");
    });

    it("Should create a pair between tokenA and tokenB", async () => {
        expect(await factory.getPair(tokenA.target, tokenB.target)).to.equal(ethers.ZeroAddress);

        await factory.createPool(tokenA.target, tokenB.target);

        const pairAddress = await factory.getPair(tokenA.target, tokenB.target);

        expect(pairAddress).not.to.equal(ethers.ZeroAddress)
        expect(await factory.getPoolsCount()).to.equal(1);
    });

    it("Should not let to be created a pair between tokenA and tokenB again", async () => {
        await expect(factory.createPool(tokenA.target, tokenB.target)).to.be.revertedWith("CosmicSwap: EXISTENT_PAIR");
    });

    it("Should not let to be created a pair between tokenA and tokenA", async () => {
        await expect(factory.createPool(tokenA.target, tokenA.target)).to.be.revertedWith("CosmicSwap: IDENTICAL_ADDRESSES");
    });

    it("Should let to be created a pair between tokenA and tokenC", async () => {
        expect(await factory.getPair(tokenA.target, tokenC.target)).to.equal(ethers.ZeroAddress);

        await factory.createPool(tokenA.target, tokenC.target);

        const pairAddress = await factory.getPair(tokenA.target, tokenC.target);

        expect(pairAddress).not.to.equal(ethers.ZeroAddress)
        expect(await factory.getPoolsCount()).to.equal(2);
    });
});