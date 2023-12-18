const { ethers } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrFactory, adrRouter } = config


async function main() {
    const [signer0] = await ethers.getSigners();
    const Router = await ethers.getContractAt("CosmicSwapRouter", "0xA4c8Dc035f9370A10f71617FE44C516383a6cB35");

    swap = async (signer, tokenAddress0, tokenAddress1, amount) => {
        const Token0 = await ethers.getContractAt("MintableToken", "0x48E6A086A4C9F8F60bD7D68b5B218d05565cFc6d");
        await Token0.connect(signer).approve(Router.target, amount);

        const txn = await Router.swap(
            tokenAddress0,
            tokenAddress1,
            amount,
            signer.address
        )

        console.log("Transaction hash: ", txn.hash)
    }

    swap(signer0, "0x48E6A086A4C9F8F60bD7D68b5B218d05565cFc6d", "0x81ca188Ecea5BC1B91969EC94B1206584E25C367", ethers.parseEther("10"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});