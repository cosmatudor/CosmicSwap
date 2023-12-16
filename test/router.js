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

            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            const pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);

            const liquidityOwnerOld = await pair.balanceOf(owner.address);

            await router.connect(owner).addLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("1100"),
                ethers.parseEther("200"),
                owner.address
            );

            expect(await tokenA.balanceOf(pairAddress)).to.equal(ethers.parseEther("1500")); // router should transfer only 1000 to pair
            expect(await tokenB.balanceOf(pairAddress)).to.equal(ethers.parseEther("300"));

            const [reserve0, reserve1] = await pair.getReserves();
            const totalSupply = await pair.totalSupply();
            const liquidity = parseFloat(1000n) * parseFloat(totalSupply) / parseFloat(reserve0) < parseFloat(200n) * parseFloat(totalSupply) / parseFloat(reserve1)
                ? parseFloat(1000n) * parseFloat(totalSupply) / parseFloat(reserve0)
                : parseFloat(200n) * parseFloat(totalSupply) / parseFloat(reserve1);
            const newAddedLiquidity = await ethers.parseEther(liquidity.toString())


            const TOLERANCE = 0.0000000001; // 10 ** -10
            const expectedBalance = liquidityOwnerOld + newAddedLiquidity; // old total liquidity + new liquidity added
            const actualBalance = await pair.totalSupply(); // must be equal to new total liquidity
            const result = parseFloat((expectedBalance - actualBalance).toString());

            expect(result).to.be.lessThan(TOLERANCE);
            expect(await pair.balanceOf(owner.address)).to.equal(await pair.totalSupply() - ethers.parseEther("0.000000000000001"));
        });

        it("CASE 3: desiredAmount0 / desiredAmount1 < reserve0 / reserve1", async () => {
            // ex: 1000 / 250 < 1500 / 300

            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            const pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);

            const liquidityOwnerOld = await pair.balanceOf(owner.address);

            await router.connect(owner).addLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("1000"),
                ethers.parseEther("250"),
                owner.address
            );

            expect(await tokenA.balanceOf(pairAddress)).to.equal(ethers.parseEther("2500"));
            expect(await tokenB.balanceOf(pairAddress)).to.equal(ethers.parseEther("500")); // router should transfer only 200 to pair

            const [reserve0, reserve1] = await pair.getReserves();
            const totalSupply = await pair.totalSupply();
            const liquidity = parseFloat(1000n) * parseFloat(totalSupply) / parseFloat(reserve0) < parseFloat(200n) * parseFloat(totalSupply) / parseFloat(reserve1)
                ? parseFloat(1000n) * parseFloat(totalSupply) / parseFloat(reserve0)
                : parseFloat(200n) * parseFloat(totalSupply) / parseFloat(reserve1);
            const newAddedLiquidity = await ethers.parseEther(liquidity.toString())


            const TOLERANCE = 0.0000000001; // 10 ** -10
            const expectedBalance = liquidityOwnerOld + newAddedLiquidity; // old total liquidity + new liquidity added
            const actualBalance = await pair.totalSupply(); // must be equal to new total liquidity
            const result = parseFloat((expectedBalance - actualBalance).toString());

            expect(result).to.be.lessThan(TOLERANCE);
            expect(await pair.balanceOf(owner.address)).to.equal(await pair.totalSupply() - ethers.parseEther("0.000000000000001"));
        });

        it("CASE 4: desiredAmount0 / desiredAmount1 = reserve0 / reserve1", async () => {
            // ex: 50 / 10 = 2500 / 500

            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            const pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);

            const liquidityOwnerOld = await pair.balanceOf(owner.address);

            await router.connect(owner).addLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("50"),
                ethers.parseEther("10"),
                owner.address
            );

            expect(await tokenA.balanceOf(pairAddress)).to.equal(ethers.parseEther("2550"));
            expect(await tokenB.balanceOf(pairAddress)).to.equal(ethers.parseEther("510"));

            const [reserve0, reserve1] = await pair.getReserves();
            const totalSupply = await pair.totalSupply();
            const liquidity = parseFloat(50n) * parseFloat(totalSupply) / parseFloat(reserve0) < parseFloat(10n) * parseFloat(totalSupply) / parseFloat(reserve1)
                ? parseFloat(50n) * parseFloat(totalSupply) / parseFloat(reserve0)
                : parseFloat(10n) * parseFloat(totalSupply) / parseFloat(reserve1);

            const newAddedLiquidity = await ethers.parseEther(liquidity.toString())


            const TOLERANCE = 0.0000000001; // 10 ** -10
            const expectedBalance = liquidityOwnerOld + newAddedLiquidity; // old total liquidity + new liquidity added
            expect(expectedBalance).to.be.greaterThan(liquidityOwnerOld);
            const actualBalance = await pair.totalSupply(); // must be equal to new total liquidity
            const result = parseFloat((actualBalance - expectedBalance).toString());

            expect(result).to.be.lessThan(TOLERANCE);
            expect(await pair.balanceOf(owner.address)).to.equal(await pair.totalSupply() - ethers.parseEther("0.000000000000001"));
        });
    });

    describe("Removing liquidity", function () {
        let pair;

        this.beforeAll(async function () {
            // owner should allow CosmicSwap to remove liquidity from his balance
            const pairAddress = await factory.getPair(tokenA.target, tokenB.target);
            pair = await ethers.getContractAt("CosmicSwapPair", pairAddress);
            await pair.connect(owner).approve(router.target, ethers.MaxUint256);
        });

        it("Should remove liquidity from pool and send it to user", async () => {

            const supplyPreBurn = await pair.totalSupply();
            const tokenAPreBurn = await tokenA.balanceOf(owner.address);
            const tokenBPreBurn = await tokenB.balanceOf(owner.address);

            // now let's burn some
            await router.connect(owner).removeLiquidity(
                tokenA.target,
                tokenB.target,
                ethers.parseEther("100"),
                owner.address
            )

            const supplyPostBurn = await pair.totalSupply();
            const tokenAPostBurn = await tokenA.balanceOf(owner.address);
            const tokenBPostBurn = await tokenB.balanceOf(owner.address);

            expect(supplyPreBurn - supplyPostBurn).to.equal(ethers.parseEther("100"));
            expect(tokenAPreBurn).to.be.lessThan(tokenAPostBurn);
            expect(tokenBPreBurn).to.be.lessThan(tokenBPostBurn);
        });
    });
});