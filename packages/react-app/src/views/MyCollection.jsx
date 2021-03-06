import { Card, Space } from "antd";
import React, { useState } from "react";
import { Events } from "../components";
import { Tooltip } from "antd";
import { FileSearchOutlined, SendOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useLocalNFTLoader, getNFT } from "../helpers/NFTLoader";
import NFTEvents from "../components/NFTEvents";
import NFTCard from "../components/NFTCard";
import SwapOffers from "../components/SwapOffers";
import { useLocation } from "react-router-dom";
import SwapRequests from "../components/SwapRequests";

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

  // const nfts = targetNetwork.name === "mainnet" ? useMainnetNFTLoader(mainnetProvider, "0xaB8046D6D79569895653086C1F83AcFC5a1703Fa") : useLocalNFTLoader(address, localContracts)
  const nfts = useLocalNFTLoader(address, localContracts)
  const location = useLocation()
  const message = location.state?.message
  console.log(">>>>> Message ", message);
  return (
    <div>
      <h2>{message}</h2>
      <div style={{ padding: 16, width: "90%", margin: "auto", marginTop: 64 }}>
        {address ?
          <>
            <div style={styles.NFTs}>
              <Space size={[16, 32]} wrap>
                {nfts &&
                  nfts.map((nft, index) => (
                    <NFTCard nft={nft} key={index} actions={[
                      // <Tooltip title="View On Blockexplorer">
                      //   <FileSearchOutlined
                      //     onClick={() => window.open(`${getExplorer(chainId)}address/${nft.token_address}`, "_blank")}
                      //   />
                      // </Tooltip>,
                      // <Tooltip title="Transfer NFT">
                      //   <SendOutlined onClick={() => handleTransferClick(nft)} />
                      // </Tooltip>,
                      // <Tooltip title="Sell On OpenSea">
                      //   <ShoppingCartOutlined onClick={() => alert("OPENSEA INTEGRATION COMING!")} />
                      // </Tooltip>,
                    ]} />
                  ))}
              </Space>
            </div>
          </>
          : <><h2>Please connect your wallet to see your NFTs</h2></>
        }
      </div>
      <SwapOffers localContracts={localContracts} address={address} provider={localProvider} writeContracts={writeContracts} />
      <SwapRequests localContracts={localContracts} address={address} provider={localProvider} writeContracts={writeContracts} />
    </div>
  );
}
