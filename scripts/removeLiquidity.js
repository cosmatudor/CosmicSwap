const { ethers } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrFactory, adrRouter } = config


async function main() {
    const [signer0, signer1, signer2] = await ethers.getSigners();
    const Router = await ethers.getContractAt("CosmicSwapRouter", adrRouter);

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

    removeLiquidity(signer0, adrTokenA, adrTokenB, ethers.parseEther("10"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});