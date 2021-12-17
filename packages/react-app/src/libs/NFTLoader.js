import { useState, useEffect } from "react";
import { useNFTBalances } from "react-moralis";
import {
    useContractReader,
} from "eth-hooks";

const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
const { BufferList } = require("bl");

export function useMainnetNFTLoader(address) {
    return useNFTBalances({ address: address });
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

export function useLocalNFTLoader(address, localProvider, localContracts) {
    const [nfts, setNfts] = useState({});
    const balance = useContractReader(localContracts, "NilToken", "balanceOf", [address]);
    console.log("🤗 balance:", balance);
    useEffect(async () => {
        const collectibleUpdate = [];
        for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
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
                    collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
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
    }, [balance]);
    //use local network
    return nfts;
}
