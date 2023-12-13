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

    /* Pair */
    // const Pair = await ethers.getContractFactory("CosmicSwapPair");
    // const pair_A_B = await Pair.deploy("0x5FbDB2315678afecb367f032d93F642f64180aa3", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    // await pair_A_B.waitForDeployment();
    // console.log("Pair A-B:", pair_A_B.target);

    /* Factory */
    const Factory = await ethers.getContractFactory("CosmicSwapFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    console.log(`Factory: ${factory.target}`);

    /* Router */
    const Router = await ethers.getContractFactory("CosmicSwapRouter");
    const router = await Router.deploy("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
    await router.waitForDeployment();
    console.log(`Router: ${router.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});