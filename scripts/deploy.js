const { ethers } = require("hardhat");

async function main() {
    /* Tokens */
    const TokenFactory = await ethers.getContractFactory("MintableToken");

    const tokenA = await TokenFactory.deploy("TokenA", "TKA");
    await tokenA.waitForDeployment();
    console.log("Token A: ", tokenA.target);

    const tokenB = await TokenFactory.deploy("TokenB", "TKB");
    await tokenB.waitForDeployment();
    console.log("Token B: ", tokenB.target);

    /* Factory */
    const Factory = await ethers.getContractFactory("CosmicSwapFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    console.log(`Factory: ${factory.target}`);

    /* Router */
    const Router = await ethers.getContractFactory("CosmicSwapRouter");
    const router = await Router.deploy(factory.target);
    await router.waitForDeployment();
    console.log(`Router: ${router.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});