import { List, Skeleton } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../components";
import { Moralis } from "moralis";
import { useEffect, useState } from "react";


export default function NFTEvents({ address }) {

  const [events, setEvents] = useState();

  useEffect(async () => {
    //only get last 10 events
    const response = await Moralis.Web3API.account.getNFTTransfers({ address: address, limit: 10 });
    console.log(">>>> Response ", response);
    //TOOD: We have to handle more
    setEvents(response.result.slice(0, 10));
  }, [address]);
  return (
    <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
      <h2>Events:</h2>
      <List
        bordered
        dataSource={events}
        renderItem={item => {
          return (
            <List.Item key={item.block_number + "_" + item.from_address + "_" + item.to_address}>
              <List.Item.Meta
                title={"Transfer of " + item.token_address}
                description={"From: " + item.from_address + " to: " + item.to_address}
              />
              <div>{item.transaction_hash}</div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
