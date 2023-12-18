const { ethers } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrFactory, adrRouter } = config


async function main() {
    const [signer0] = await ethers.getSigners();
    const Router = await ethers.getContractAt("CosmicSwapRouter", "0xA4c8Dc035f9370A10f71617FE44C516383a6cB35");

    removeLiquidity = async (signer, tokenAddress0, tokenAddress1, liquidity) => {
        const factoryAddress = await Router.factory(); // Get the factory address from the router
        const Factory = await ethers.getContractAt("CosmicSwapFactory", factoryAddress); // Get the factory contract

        const pairAddress = await Factory.getPair(tokenAddress0, tokenAddress1) // Get the pair address
        const Pair = await ethers.getContractAt("CosmicSwapPair", pairAddress); // Get the pair contract

        await Pair.connect(signer).approve(Router.target, liquidity); // Approve the router to spend the liquidity tokens

        const txn = await Router.removeLiquidity(
            tokenAddress0,
            tokenAddress1,
            liquidity,
            signer.address
        )

        console.log("Transaction hash: ", txn.hash)
    }

    removeLiquidity(signer0, "0x48E6A086A4C9F8F60bD7D68b5B218d05565cFc6d", "0x81ca188Ecea5BC1B91969EC94B1206584E25C367", ethers.parseEther("40"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});