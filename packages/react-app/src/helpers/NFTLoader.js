import { useState, useEffect } from "react";
// import { useNFTBalances } from "react-moralis";
import { Moralis } from "moralis";
import { Contract } from 'ethers';
import { ERC721ABI } from "../contracts/erc721_abi";

const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
const { BufferList } = require("bl");

const hardcodedAddresses = ["mrclean.eth", "austingriffith.eth", "0x426ab67a5bdbf55dda4b5ad15972b263cab4e540", "0x5e577d19cd9a97dcf08f89ba927a3be2ca5b2106", "0xa8da6166cbd2876ccde424ee2a717c355be4702b"]

const replaceIpfsMaybe = (url) => {
    return url?.replace("ipfs://", "https://ipfs.io/ipfs/");
}

export const loadTestNFTWallets = async (localContracts) => {
    const testWallets = ["0x3f88A4ce6A71Bb2308E231855380D373A7241861", "0x3a4535E25fD02c757EBfdaE38ed99593c634ce65"]
    const allPromises = testWallets.map(async (address) => {
        const nfts = await getLocalNFTs(address, localContracts);
        return { address: address, nfts: nfts };
    })
    return await Promise.all(allPromises);
}

const getFromIPFS = async hashToGet => {
    for await (const file of ipfs.get(hashToGet)) {
        console.log(file.path);
        if (!file.content) continue;
        const content = new BufferList();
        for await (const chunk of file.content) {
            content.append(chunk);
        }
        console.log(content);
        return content;
    }
};

export async function resolveAndGetNFTs(provider, address) {
    const resolvedAddress = await provider?.resolveName(address);
    console.log(">>>> Resolved address ", resolvedAddress);
    const nfts = await getNFTs(resolvedAddress);
    return nfts;
}

export async function getNFTs(address) {
    const response = await Moralis.Web3API.account.getNFTs({ address: address });
    console.log("Result ", response.result);
    const nfts = response.result.filter(n => n.metadata).map(n => {
        const contract_type = n.contract_type;
        //sometimes meta data could be blank
        const metadata = JSON.parse(n.metadata);
        const image = replaceIpfsMaybe(metadata?.image);
        const image_data = metadata?.image_data;
        const metaDataName = metadata?.name;
        const metaDataDescription = metadata?.description;
        const name = n.name;
        const symbol = n.symbol;
        const token_address = n.token_address;
        const token_id = n.token_id;
        const token_uri = n.token_uri
        return {
            name: metaDataName ?? name,
            description: metaDataDescription?.substring(0, 50),
            image: image,
            image_data: image_data,
            symbol: symbol,
            contract_type: contract_type,
            token_address: token_address,
            token_id: token_id,
            token_uri: token_uri
        }
    });
    return nfts;
}

export function useMainnetNFTLoader(mainnetProvider, address) {
    const [nfts, setNfts] = useState({});
    useEffect(async () => {
        const nfts = await resolveAndGetNFTs(mainnetProvider, address);
        setNfts({
            data: nfts,
            error: null,
            isLoading: false,
            isFetching: false
        });
    }, [address])
    return nfts;
}

export const getNFT = async (nftAddress, nftId, ownerAddress, provider) => {
    const erc721 = new Contract(nftAddress, ERC721ABI, provider);
    const symbol = await erc721.symbol();
    const tokenURI = await erc721.tokenURI(nftId);
    console.log("tokenURI", tokenURI);

    const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
    console.log("ipfsHash", ipfsHash);

    const jsonManifestBuffer = await getFromIPFS(ipfsHash);
    const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
    console.log("jsonManifest", jsonManifest);
    return {
        token_id: nftId.toString(),
        token_uri: tokenURI,
        symbol: symbol,
        token_address: nftAddress,
        owner: ownerAddress, ...jsonManifest
    };
}

export const getLocalNFTs = async (address, localContracts) => {
    if (!localContracts.NilToken) {
        return []
    }
    const token_address = localContracts.NilToken?.address;
    const symbol = await localContracts.NilToken?.symbol();
    const balance = await localContracts.NilToken.balanceOf(address);
    //create range of values from balance
    const allPromises = Array.from({ length: balance }, (v, i) => i).map(async (i) => {
        const tokenId = await localContracts.NilToken.tokenOfOwnerByIndex(address, i);
        const tokenURI = await localContracts.NilToken.tokenURI(tokenId);
        const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
        const jsonManifestBuffer = await getFromIPFS(ipfsHash);
        const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
        return {
            token_id: tokenId.toString(),
            token_uri: tokenURI,
            token_index: i,
            symbol: symbol,
            token_address: token_address,
            owner: address, ...jsonManifest
        };
    })
    const nfts = await Promise.all(allPromises);
    return nfts;
}

export function useLocalNFTLoader(address, localContracts) {
    const [nfts, setNfts] = useState([]);
    useEffect(async () => {
        if (address && localContracts.NilToken) {
            const nfts = await getLocalNFTs(address, localContracts);
            setNfts(nfts);
        }
    }, [address, localContracts]);
    //use local network
    return nfts;
}
