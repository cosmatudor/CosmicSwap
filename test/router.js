const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CosmicSwapRouter", function () {
    let tokenA;
    let tokenB;
    let tokenC;
    let factory;
    let router;

    let owner;

    this.beforeAll(async function () {
        const Factory = await ethers.getContractFactory("CosmicSwapFactory");
        factory = await Factory.deploy();

        const TokenA = await ethers.getContractFactory("MintableToken");
        tokenA = await TokenA.deploy("Token A", "TKA");

        const TokenB = await ethers.getContractFactory("MintableToken");
        tokenB = await TokenB.deploy("Token B", "TKB");

        const TokenC = await ethers.getContractFactory("MintableToken");
        tokenC = await TokenC.deploy("Token C", "TKC");

        const Router = await ethers.getContractFactory("CosmicSwapRouter");
        router = await Router.deploy(factory.target);
        await router.waitForDeployment();

        [owner] = await ethers.getSigners();
        await tokenA.connect(owner).approve(router.target, ethers.MaxUint256); // Approve token transfer
        await tokenB.connect(owner).approve(router.target, ethers.MaxUint256); // Approve token transfer
    });

    it("Should properly set the factory address", async () => {
        expect(await router.factory()).to.equal(factory.target);
    });

    describe("Adding liquidity", function () {
        it("CASE 1: First deposit", async () => {
            await router.connect(owner).addLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("500"),
                ethers.parseEther("100"),
                owner.address
            );

            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            const pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);

            expect(await tokenA.balanceOf(pairAddress)).to.equal(ethers.parseEther("500"));
            expect(await tokenB.balanceOf(pairAddress)).to.equal(ethers.parseEther("100"));

            const liquidity = Math.sqrt(500 * 100);
            const liquidityOwner = liquidity - 1 / (10 ** 15);
            expect(await pair.balanceOf(owner.address)).to.be.closeTo(ethers.parseEther(liquidityOwner.toString()), 10n ** 18n);
            expect(await pair.totalSupply()).to.be.closeTo(ethers.parseEther(liquidity.toString()), 10n ** 18n);
        });

        it("CASE 2: desiredAmount0 / desiredAmount1 > reserve0 / reserve1", async () => {
            // ex: 1100 / 200 > 500 / 100
            await router.connect(owner).addLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("1100"),
                ethers.parseEther("200"),
                owner.address
            );

            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            const pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);

            expect(await tokenA.balanceOf(pairAddress)).to.equal(ethers.parseEther("1600"));
            expect(await tokenB.balanceOf(pairAddress)).to.equal(ethers.parseEther("300"));


        });

        it("CASE 3: desiredAmount0 / desiredAmount1 < reserve0 / reserve1", async () => { });

        it("CASE 4: desiredAmount0 / desiredAmount1 = reserve0 / reserve1", async () => { });
    });

    describe("Removing liquidity", function () {
        it("Should remove liquidity from pool and send it to user", async () => { });
    });
});