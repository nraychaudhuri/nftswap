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
    description: "AI Pokemon 108",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/195000-108-1599624361.png",
    name: "195000-108",
    color: "green"
  },
  {
    description: "AI Pokemon 113",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/215000-103-1599608767.png",
    name: "215000 - 103",
    color: "mix"
  },
  {
    description: "AI Pokemon 102",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/215000-102-1599608853.png",
    name: "215000 - 102",
    color: "yellow"
  },
  {
    description: "AI Pokemon 100",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/215000-100-1599608337.png",
    name: "215000 - 100",
    color: "black"
  },
  {
    description: "AI Pokemon 095",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/215000-095-1599771055.png",
    name: "215000 - 095",
    color: "blue"
  },
  {
    description: "AI Pokemon 088",
    image: "https://matthewrayfield.com/projects/ai-pokemon/images/215000-088-1599609186.png",
    name: "215000 - 088",
    color: "orange"
  },
]

const main = async () => {

  // ADDRESS TO MINT TO:
  const toAddress1 = "0xDDE8f65a8eC80E64738312Bb69F11ae0A3F47E8C"
  const toAddress2 = "0x3f88A4ce6A71Bb2308E231855380D373A7241861"
  const toAddress3 = "0x3a4535E25fD02c757EBfdaE38ed99593c634ce65"

  const addresses = [toAddress1, toAddress2, toAddress3];


  const { deployer } = await getNamedAccounts();
  const nilToken = await ethers.getContract("NilToken", deployer);

  const promises = aiPokemons.map(async (p, index) => {
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
    const toAddress = addresses[index % 3]
    console.log("\n\n 🎫 Minting to " + toAddress + "...with index " + index + "\n");
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
