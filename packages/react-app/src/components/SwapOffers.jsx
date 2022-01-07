import { List, Skeleton, Button } from "antd";
import { useEffect, useState } from "react";
import NFTCard from "../components/NFTCard";
import { getOffers, notifyWhenSwapCompleted } from "../helpers/SwapHelper";

export default function SwapOffers({ address, provider, localContracts, writeContracts }) {

  const [offers, setOffers] = useState([])
  useEffect(async () => {
    if (localContracts.SwapBook && address) {
      const offers = await getOffers(address, localContracts.SwapBook, provider);
      setOffers(offers);
    }
  }, [address])

  const acceptSwap = async (offer) => {
    await writeContracts.NilToken.approve(localContracts.SwapBook.address, offer.receiverNft.token_id);
    const receipt = await writeContracts.SwapBook
      .acceptOffer(offer.offerId);
    console.log("receipt ", receipt);
    notifyWhenSwapCompleted(localContracts.SwapBook, address, () => {
      console.log(">>>> Swap completed ");
      window.location.reload(false);
    })
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
              <NFTCard nft={offer.receiverNft} key={offer.receiverNft.token_uri + "-" + offer.receiverNft.token_address} actions={[
              ]} />
              <NFTCard nft={offer.requestorNft} key={offer.requestorNft.token_uri + "-" + offer.requestorNft.token_address} actions={[
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
