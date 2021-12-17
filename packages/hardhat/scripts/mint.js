/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

const delayMS = 1000 //sometimes xDAI needs a 6000ms break lol 😅

const aiPokemons = [
  {
    description: "AI Pokemon 83",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/245000-083-1599747846.png",
    name: "245000-083",
    color: "blue"
  },
  {
    description: "AI Pokemon 107",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/240000-107-1599768174.png",
    name: "240000-107",
    color: "purple"
  },
  {
    description: "AI Pokemon 113",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/235000-113-1599750178.png",
    name: "235000-113",
    color: "green"
  },
  {
    description: "AI Pokemon 113",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/195000-108-1599624361.png",
    name: "195000-108",
    color: "green"
  },
]

const main = async () => {

  // ADDRESS TO MINT TO:
  const toAddress = "0xDDE8f65a8eC80E64738312Bb69F11ae0A3F47E8C"

  console.log("\n\n 🎫 Minting to " + toAddress + "...\n");

  const { deployer } = await getNamedAccounts();
  const nilToken = await ethers.getContract("NilToken", deployer);

  const promises = aiPokemons.map(async (p) => {
    const aiPokemon = {
      "description": p.description,
      "external_url": "https://matthewrayfield.com/projects/ai-pokemon/",// <-- this can link to a page for the specific file too
      "image": p.image,
      "name": p.name,
      "attributes": [
        {
          "trait_type": "color",
          "value": p.color
        }
      ]
    }
    console.log("Uploading pokemon ", p.name)
    const uploaded = await ipfs.add(JSON.stringify(aiPokemon))

    console.log("Minting pokemon with IPFS hash (" + uploaded.path + ")")
    await nilToken.mintNil(toAddress, uploaded.path, { gasLimit: 400000 })
    await sleep(delayMS)
  });

  await Promise.all(promises); //wait for minting to finish
  // console.log("Transferring Ownership of YourCollectible to " + toAddress + "...")

  // await yourCollectible.transferOwnership(toAddress, { gasLimit: 400000 });

  // await sleep(delayMS)

};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
