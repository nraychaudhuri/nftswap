import { List, Skeleton, Button } from "antd";
import { useEffect, useState } from "react";
import { Contract } from 'ethers';
import { ERC721ABI } from "../contracts/erc721_abi";
import { getNFT } from "../libs/NFTLoader";
import NFTCard from "../components/NFTCard";

export default function SwapOffers({ address, provider, localContracts, writeContracts }) {

  const [offers, setOffers] = useState([])
  useEffect(async () => {
    const offerIds = await localContracts.SwapBook?.offersReceived(address);
    if (offerIds) {
      const promises = await offerIds?.map(async (element) => {
        const [requestorAddress, requestorNftAddress, requestorNftId, receiverAddress, receiverNftAddress, receiverNftId] =
          await localContracts.SwapBook.getOffer(element);
        const requestorNft = await getNFT(requestorNftAddress, requestorNftId, requestorAddress, provider);
        const userNft = await getNFT(receiverNftAddress, receiverNftId, receiverAddress, provider);
        return { offerId: element, otherNft: requestorNft, myNft: userNft };
      })
      const offers = await Promise.all(promises);
      setOffers(offers);
    }
  }, [address])

  const acceptSwap = async (offer) => {
    await writeContracts.NilToken.approve(localContracts.SwapBook.address, offer.myNft.token_id);
    const receipt = await writeContracts.SwapBook
      .acceptOffer(offer.offerId);
    console.log("receipt ", receipt);
  }

  return (
    <div style={{ width: "60%", margin: "auto", marginTop: 32, paddingBottom: 32, alignItems: "center" }}>
      <h2>Offers:</h2>
      <List
        bordered
        dataSource={offers}
        renderItem={offer => {
          return (
            <List.Item key={offer}>
              <List.Item.Meta
                title={"Swap Offer" + offer.offerId}
              />
              <NFTCard nft={offer.myNft} key={offer.myNft.token_uri + "-" + offer.myNft.token_address} actions={[
              ]} />
              <NFTCard nft={offer.otherNft} key={offer.otherNft.token_uri + "-" + offer.otherNft.token_address} actions={[
              ]} />
              <div>
                <Button
                  onClick={() => {
                    acceptSwap(offer)
                  }}
                  size="large"
                  shape="round"
                >
                  <span style={{ marginRight: 8 }} role="img" aria-label="support">
                    🔀
                  </span>
                  Accept Swap
                </Button>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
