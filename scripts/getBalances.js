const { ethers, artifacts } = require("hardhat");
const config = require("./config");

const { adrTokenA, adrTokenB, adrFactory, adrRouter } = config

async function main() {
  const [signer0, signer1] = await ethers.getSigners();

  /* Artifacts */
  const tokenArtifact = await artifacts.readArtifact("MintableToken");
  const pairArtifact = await artifacts.readArtifact("CosmicSwapPair")
  const factoryArtifact = await artifacts.readArtifact("CosmicSwapFactory")
  const routerArtifact = await artifacts.readArtifact("CosmicSwapRouter")

  /* Balance of tokenA and Token B */
  const tokenA = new ethers.BaseContract(adrTokenA, tokenArtifact.abi, signer0)
  const tokenB = new ethers.BaseContract(adrTokenB, tokenArtifact.abi, signer0)
  console.log(`Balance TokenA of owner: ${ethers.formatEther(await tokenA.balanceOf(signer0.address))}`);
  console.log(`Balance TokenB of owner: ${ethers.formatEther(await tokenB.balanceOf(signer0.address))}`);

  /* Balance of LP Token */
  const factory = new ethers.BaseContract(
    adrFactory,
    factoryArtifact.abi,
    signer0
  )

  const pairA_B = await factory.getPair(adrTokenA, adrTokenB)
  const pairA_B_Contract = await ethers.getContractAt(
    pairArtifact.abi,
    pairA_B,
    signer0
  )

  console.log(`Balance LP of owner: ${ethers.formatEther(await pairA_B_Contract.balanceOf(signer0.address))}`)
  console.log(`Balance LP of signer1: ${ethers.formatEther(await pairA_B_Contract.balanceOf(signer1.address))}`)
  console.log(`Total Balance LP: ${ethers.formatEther(await pairA_B_Contract.totalSupply())}`)

  const [reserve0, reserve1] = await pairA_B_Contract.getReserves()
  console.log(`Reserve TokenA:`, ethers.formatEther(reserve0))
  console.log(`Reserve TokenB:`, ethers.formatEther(reserve1))
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});