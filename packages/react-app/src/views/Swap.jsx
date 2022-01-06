import { Card, Space, Row, Col, Button } from "antd";
import React, { useState } from "react";
import { getLocalNFTs } from "../libs/NFTLoader";
import { useParams } from "react-router-dom";
import NFTSlider from "../components/NFTSlider";
import { useEffect } from "react";
import { notifyWhenSwapRequested } from "../helpers/SwapEventHandler";
import { Redirect } from "react-router-dom";

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

export default function Swap({
    writeContracts,
    userAddress,
    mainnetProvider,
    localProvider,
    localContracts,
    targetNetwork
}) {
    const { otherAddress } = useParams();
    const [otherNfts, setOtherNfts] = useState();
    const [userNfts, setUserNfts] = useState();
    const [readyToSwap, setReadyToSwap] = useState(false);

    const [swapOffer, setSwapOffer] = useState({})

    const [redirect, setRedirect] = useState(null);

    useEffect(() => {
        if (userAddress && otherAddress) {
            const swapOffer = {
                receiverAddress: otherAddress,
                requestorAddress: userAddress
            }
            setSwapOffer(swapOffer);
            notifyWhenSwapRequested(writeContracts.SwapBook, userAddress, (myAddress, otherAddress, offerId) => {
                setRedirect(true);
            });
        }
    }, [userAddress, otherAddress])

    const requestSwap = async () => {
        await writeContracts.NilToken.approve(localContracts.SwapBook.address, swapOffer.requestorTokenId);
        const receipt = await writeContracts.SwapBook
            .requestSwap(swapOffer.requestorTokenAddress, swapOffer.requestorTokenId, otherAddress, swapOffer.receiverTokenAddress, swapOffer.receiverTokenId)
        console.log("receipt ", receipt);
    }

    const selectReceiverNft = (tokenAddress, tokenId) => {
        swapOffer.receiverTokenAddress = tokenAddress;
        swapOffer.receiverTokenId = tokenId;
        setSwapOffer(swapOffer);
        setReadyToSwap(isSwapOfferCompleted(swapOffer))
    }
    const selectRequestorNft = (tokenAddress, tokenId) => {
        swapOffer.requestorTokenAddress = tokenAddress;
        swapOffer.requestorTokenId = tokenId;
        setSwapOffer(swapOffer);
        setReadyToSwap(isSwapOfferCompleted(swapOffer))
    }

    const isSwapOfferCompleted = (swapOffer) => {
        return swapOffer.receiverTokenAddress && swapOffer.receiverTokenId && swapOffer.requestorTokenAddress && swapOffer.requestorTokenId
    }

    useEffect(async () => {
        if (localContracts && targetNetwork.name === "localhost") {
            const otherNfts = await getLocalNFTs(otherAddress, localContracts);
            setOtherNfts(otherNfts);

            const userNfts = await getLocalNFTs(userAddress, localContracts);
            setUserNfts(userNfts);
        } else {
            alert("Only localhost is supported");
        }
    }, [otherAddress, userAddress, targetNetwork]);
    return (
        <>
            {
                redirect ? <Redirect
                    to={{
                        pathname: "/mycollection",
                        state: { message: "Your Offer is sent. You will be notified when the offer is accepted" }
                    }}
                /> :
                    <div>
                        <h2>Collection of {otherAddress}</h2>
                        <NFTSlider nfts={otherNfts} nftSelector={selectReceiverNft} />
                        <h2>Your Collection</h2>
                        <NFTSlider nfts={userNfts} nftSelector={selectRequestorNft} />
                        {readyToSwap ?
                            <div style={{ position: "fixed", textAlign: "left", right: 10, bottom: "40%", padding: 10 }}>
                                <Row align="middle" gutter={[4, 4]}>
                                    <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
                                        <Button
                                            onClick={() => {
                                                requestSwap()
                                            }}
                                            size="large"
                                            shape="round"
                                        >
                                            <span style={{ marginRight: 8 }} role="img" aria-label="support">
                                                🔀
                                            </span>
                                            Request Swap
                                        </Button>
                                    </Col>
                                </Row>
                            </div> : <></>
                        }

                    </div>
            }
        </>);
}
