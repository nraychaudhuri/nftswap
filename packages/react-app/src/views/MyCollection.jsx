import { Card, Space } from "antd";
import React, { useState } from "react";
import { Events } from "../components";
import { Tooltip } from "antd";
import { FileSearchOutlined, SendOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useLocalNFTLoader, getNFT } from "../libs/NFTLoader";
import NFTEvents from "../components/NFTEvents";
import NFTCard from "../components/NFTCard";
import SwapOffers from "../components/SwapOffers";

const { Meta } = Card;

const styles = {
  NFTs: {
    display: "flex",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
    justifyContent: "flex-start",
    margin: "0 auto",
    maxWidth: "1000px",
    width: "100%",
    gap: "10px",
  },
};

export default function NFTUI({
  address,
  mainnetProvider,
  localProvider,
  localContracts,
  targetNetwork,
  writeContracts
}) {

  const createSvg = (text) => { return { __html: text }; };
  // const nfts = targetNetwork.name === "mainnet" ? useMainnetNFTLoader(mainnetProvider, "0xaB8046D6D79569895653086C1F83AcFC5a1703Fa") : useLocalNFTLoader(address, localContracts)
  const nfts = useLocalNFTLoader(address, localContracts)
  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ padding: 16, width: "90%", margin: "auto", marginTop: 64 }}>
        {address ?
          <>
            <div style={styles.NFTs}>
              <Space size={[16, 32]} wrap>
                {nfts.data &&
                  nfts.data.map((nft, index) => (
                    <NFTCard nft={nft} key={index} actions={[
                      <Tooltip title="View On Blockexplorer">
                        <FileSearchOutlined
                          onClick={() => window.open(`${getExplorer(chainId)}address/${nft.token_address}`, "_blank")}
                        />
                      </Tooltip>,
                      <Tooltip title="Transfer NFT">
                        <SendOutlined onClick={() => handleTransferClick(nft)} />
                      </Tooltip>,
                      <Tooltip title="Sell On OpenSea">
                        <ShoppingCartOutlined onClick={() => alert("OPENSEA INTEGRATION COMING!")} />
                      </Tooltip>,
                    ]} />
                  ))}
              </Space>
            </div>
          </>
          : <><h2>Please connect your wallet to see your NFTs</h2></>
        }
      </div>
      <SwapOffers localContracts={localContracts} address={address} provider={localProvider} writeContracts={writeContracts} />
      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      {/* {targetNetwork.name === "mainnet" ?
        <NFTEvents address={"0xaB8046D6D79569895653086C1F83AcFC5a1703Fa"} /> :
        <Events
          contracts={localContracts}
          contractName="NilToken"
          eventName="Transfer"
          localProvider={localProvider}
          mainnetProvider={mainnetProvider}
          startBlock={1}
        />
      } */}
    </div>
  );
}
