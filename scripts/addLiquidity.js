const { ethers } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrRouter } = config


async function main() {
    const [signer0] = await ethers.getSigners();
    const router = await ethers.getContractAt("CosmicSwapRouter", "0xA4c8Dc035f9370A10f71617FE44C516383a6cB35");

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

    addLiquidity(signer0, "0x48E6A086A4C9F8F60bD7D68b5B218d05565cFc6d", "0x81ca188Ecea5BC1B91969EC94B1206584E25C367", ethers.parseEther("100"), ethers.parseEther("200"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});