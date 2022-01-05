import React from "react";
import { useState, useEffect } from "react";
import { loadTestNFTWallets } from "../libs/NFTLoader";
import { Tooltip, Card, Space } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import NFTCard from "../components/NFTCard";
import { useHistory } from "react-router";

const { Meta } = Card;

function Home({ targetNetwork, localContracts }) {
  const [collection, setCollection] = useState([]);
  const history = useHistory();

  const exploreCollection = (address) => {
    history.push(`/explore/to/swap/${address}`)
  }
  useEffect(async () => {
    if (localContracts && targetNetwork.name === "localhost") {
      const collection = await loadTestNFTWallets(localContracts);
      const x = collection.filter(col => col.nfts.length > 0).map(col => {
        const nft = col.nfts[0];
        nft.description = "Collection of " + col.address;
        return { address: col.address, nft: col.nfts[0] }
      });
      console.log(">>> Collection ", x);
      setCollection(x);
    } else {
      alert("Noy Supported");
    }
  }, [targetNetwork, localContracts]);
  return (
    <div>
      <div style={{ padding: 16, width: "90%", margin: "auto", marginTop: 64 }}>
        <>
          <div>
            <Space size={[16, 32]} wrap>
              {collection &&
                collection.map((col, index) => (
                  <NFTCard nft={col.nft} key={index} actions={[
                    <Tooltip title="Swap NFTs">
                      <SwapOutlined onClick={() => exploreCollection(col.address)} />
                    </Tooltip>
                  ]} />
                ))}
            </Space>
          </div>
        </>
      </div>
    </div>
  );
}

export default Home;
