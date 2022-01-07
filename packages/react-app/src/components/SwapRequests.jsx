import { List, Skeleton, Button } from "antd";
import { useEffect, useState } from "react";
import NFTCard from "./NFTCard";
import { getRequests, notifyWhenSwapCancelled } from "../helpers/SwapHelper";

export default function SwapRequests({ address, provider, localContracts, writeContracts }) {

  const [requests, setRequests] = useState([])
  useEffect(async () => {
    if (localContracts.SwapBook && address) {
      const requests = await getRequests(address, localContracts.SwapBook, provider);
      setRequests(requests);
    }
  }, [address])

  const cancelSwap = async (offer) => {
    const receipt = await writeContracts.SwapBook
      .cancelOffer(offer.offerId);
    console.log("receipt ", receipt);
    notifyWhenSwapCancelled(writeContracts.SwapBook, address, () => {
      console.log(">>>> Swap cancelled ");
      window.location.reload(false);
    });
  }

  return (
    <div style={{ width: "60%", margin: "auto", marginTop: 32, paddingBottom: 32, alignItems: "center" }}>
      <h2>Requests:</h2>
      <List
        bordered
        dataSource={requests}
        renderItem={request => {
          return (
            <List.Item key={request}>
              <List.Item.Meta
                title={"Swap Request" + request.offerId}
              />
              <NFTCard nft={request.requestorNft} key={request.requestorNft.token_uri + "-" + request.requestorNft.token_address} actions={[
              ]} />
              <NFTCard nft={request.receiverNft} key={request.receiverNft.token_uri + "-" + request.receiverNft.token_address} actions={[
              ]} />
              <div>
                <Button
                  onClick={() => {
                    cancelSwap(request)
                  }}
                  size="large"
                  shape="round"
                >
                  <span style={{ marginRight: 8 }} role="img" aria-label="support">
                    🔀
                  </span>
                  Cancel Swap
                </Button>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
