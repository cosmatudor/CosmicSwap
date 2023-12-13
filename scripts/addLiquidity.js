const { ethers } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrRouter } = config


async function main() {
    const [signer0, signer1, signer2] = await ethers.getSigners();
    const router = await ethers.getContractAt("CosmicSwapRouter", adrRouter);

    const addLiquidity = async (signer, tokenAddress0, tokenAddress1, amount0, amount1) => {
        const Token0 = await ethers.getContractAt("MintableToken", tokenAddress0);
        const Token1 = await ethers.getContractAt("MintableToken", tokenAddress1);

        await Token0.connect(signer).approve(router.target, amount0);
        await Token1.connect(signer).approve(router.target, amount1);

        const txn = await router.addLiquidity(
            tokenAddress0,
            tokenAddress1,
            amount0,
            amount1,
            signer.address
        )

        console.log("Transaction hash: ", txn.hash)
    }

    addLiquidity(signer0, adrTokenA, adrTokenB, ethers.parseEther("100"), ethers.parseEther("200"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});