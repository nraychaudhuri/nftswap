import { useState, useEffect } from "react";
// import { useNFTBalances } from "react-moralis";
import { Moralis } from "moralis";
import {
    useContractReader,
} from "eth-hooks";

const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
const { BufferList } = require("bl");

const replaceIpfsMaybe = (url) => {
    return url?.replace("ipfs://", "https://ipfs.io/ipfs/");
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

export function useMainnetNFTLoader(address) {
    const [nfts, setNfts] = useState({});
    // return useNFTBalances({ address: address });
    useEffect(async () => {
        const response = await Moralis.Web3API.account.getNFTs({ address: address });
        console.log("NFTS>>>>>>>>. ", response);

        const response1 = await Moralis.Web3API.account.getNFTTransfers({ address: address });
        console.log(">>>> Response ", response1);

        const nfts = response.result.map(n => {
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
        })
        setNfts({
            data: nfts,
            error: null,
            isLoading: false,
            isFetching: false
        });
    }, [address])
    return nfts;
}

export function useLocalNFTLoader(address, localContracts) {
    const [nfts, setNfts] = useState({});
    useEffect(async () => {
        const collectibleUpdate = [];
        const token_address = localContracts.NilToken?.address;
        const symbol = await localContracts.NilToken?.symbol();
        for (let tokenIndex = 0; tokenIndex < 4; tokenIndex++) {
            try {
                console.log("Getting token index", tokenIndex);
                const tokenId = await localContracts.NilToken.tokenOfOwnerByIndex(address, tokenIndex);
                console.log("tokenId", tokenId);
                const tokenURI = await localContracts.NilToken.tokenURI(tokenId);
                console.log("tokenURI", tokenURI);

                const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
                console.log("ipfsHash", ipfsHash);

                const jsonManifestBuffer = await getFromIPFS(ipfsHash);

                try {
                    const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
                    console.log("jsonManifest", jsonManifest);
                    collectibleUpdate.push({
                        token_id: tokenId.toString(),
                        token_uri: tokenURI,
                        symbol: symbol,
                        token_address: token_address,
                        owner: address, ...jsonManifest
                    });
                } catch (e) {
                    console.log(e);
                }
            } catch (e) {
                console.log(e);
            }
        }
        setNfts({
            data: collectibleUpdate,
            error: null,
            isLoading: false,
            isFetching: false
        });
    }, [address, localContracts]);
    //use local network
    return nfts;
}
